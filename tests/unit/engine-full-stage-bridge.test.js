/**
 * Regression test for the --orchestrate bridge fix: a "full stage
 * deliverable" task (key === 'stageN', not an auxiliary/partial key) must
 * end up as a real, approvable STAGE_NN_*.md file with matching journal
 * state — not just an artifacts/<stageKey>/artefact.md side file that the
 * Two-Key gate never looks at.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runPipeline } from '../../cli/src/orchestrator/engine.js';
import { loadProfile } from '../../cli/src/profiles.js';
import { createJournal, readJournal } from '../../cli/src/journal.js';
import { getProjectDir } from '../../cli/src/project.js';

let tmpBase;
let originalCwd;

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-engine-bridge-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase);
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

/** Generic mock chat: satisfies whatever sections a batch prompt asks for,
 * with numeric/date filler so the deterministic quality checks don't tank
 * the score into an endless revise loop; falls back gracefully otherwise. */
function makeMockChat({ depthScore = 100 } = {}) {
  return async (systemPrompt) => {
    if (systemPrompt.includes('BABOK Deliverable Depth Judge')) {
      return JSON.stringify({ score: depthScore, findings: [] });
    }
    const batchMatch = systemPrompt.match(/Produce ONLY these sections now: (.+?)\./);
    if (batchMatch) {
      const sections = batchMatch[1].split(',').map(s => s.trim());
      return sections
        .map(s => `## ${s}\nContent for ${s}: baseline 5 days -> target 2 days by 2026-01-01, cost 1000 EUR.`)
        .join('\n\n');
    }
    return '## Fallback\nGeneric content, 2026-01-01, 100 units.';
  };
}

describe('runPipeline bridges a full stage deliverable to the canonical file + journal', () => {
  it('writes STAGE_01_*.md and marks stage 1 approved after --orchestrate', async () => {
    const profile = loadProfile('babok');
    const projectId = `${profile.id_prefix}-19700101-BRDG`;

    createJournal(projectId, 'Bridge Test Project', 'EN', profile.id);

    let calls = 0;
    const draft = makeMockChat();
    const llmClient = { chat: async (...args) => { calls++; return draft(...args); }, modelName: 'mock-model' };

    const result = await runPipeline(projectId, {
      dryRun: false,
      profile,
      llmClient,
      stopAfterStage: 1,
    });

    assert.deepEqual(result.stagesFailed, []);
    assert.deepEqual(result.stagesCompleted, ['stage1']);
    assert.equal(calls, 1, 'orchestrator must not judge or revise with another LLM call');

    const projectDir = getProjectDir(projectId);
    const deliverableFiles = fs.readdirSync(projectDir).filter(f => f.startsWith('STAGE_01_') && f.endsWith('.md'));
    assert.equal(deliverableFiles.length, 1, 'expected exactly one canonical STAGE_01_*.md file');

    const deliverableContent = fs.readFileSync(path.join(projectDir, deliverableFiles[0]), 'utf-8');
    assert.match(deliverableContent, /## /, 'deliverable should contain real Markdown sections');

    const journal = readJournal(projectId);
    const stage1 = journal.stages.find(s => s.stage === 1);
    assert.equal(stage1.status, 'approved');
    assert.equal(stage1.deliverable_file, deliverableFiles[0]);
    assert.ok(Array.isArray(stage1.generation_batches_used) && stage1.generation_batches_used.length > 0);
    assert.equal(stage1.final_pass_mode, 'single_call');

    // The old side-channel artefact should still exist too (other code may read it).
    assert.ok(fs.existsSync(path.join(projectDir, 'artifacts', 'stage1', 'artefact.md')));
  });
});
