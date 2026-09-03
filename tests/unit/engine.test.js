/**
 * Orchestrator engine — the stage sequence must follow profile.orchestrator.pipeline.
 * Runs in dryRun mode with a stub LLM client, so no API keys or network are needed.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runPipeline } from '../../cli/src/orchestrator/engine.js';
import { listProfileIds, loadProfile } from '../../cli/src/profiles.js';

let tmpBase;
let originalCwd;

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-engine-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase); // getProjectsDir() resolves ./projects first
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

/** Flatten the declared pipeline into the ordered list of group key-sets. */
function declaredGroups(profile, stopAfterStage) {
  const groups = [];
  for (const g of profile.orchestrator.pipeline) {
    const keys = g.stages.filter(k => stopAfterStage === undefined || Number(/^stage(\d+)/.exec(k)[1]) <= stopAfterStage);
    if (keys.length === 0) break;
    groups.push(keys);
    if (keys.length !== g.stages.length) break;
  }
  return groups;
}

describe('runPipeline follows the profile pipeline declaration', () => {
  for (const profileId of listProfileIds()) {
    it(`${profileId}: stages start in the declared group order`, async () => {
      const profile = loadProfile(profileId);
      const started = [];
      const result = await runPipeline(`${profile.id_prefix}-19700101-ENG1`, {
        dryRun: true,
        profile,
        onProgress: (e) => { if (e.type === 'stage_started') started.push(e.stage); },
      });

      const declaredCount = profile.orchestrator.pipeline.reduce((n, g) => n + g.stages.length, 0);
      assert.equal(result.stagesFailed.length, 0);
      assert.equal(result.stagesCompleted.length, declaredCount);

      // Sequential groups must appear in order; parallel group members may interleave.
      const groups = declaredGroups(profile);
      let cursor = 0;
      for (const keys of groups) {
        const slice = started.slice(cursor, cursor + keys.length);
        assert.deepEqual([...slice].sort(), [...keys].sort(), `group ${keys} at position ${cursor}`);
        cursor += keys.length;
      }
      assert.equal(cursor, started.length);
    });
  }

  it('stopAfterStage truncates at the requested stage', async () => {
    const profile = loadProfile('babok');
    const result = await runPipeline('BABOK-19700101-ENG2', { dryRun: true, profile, stopAfterStage: 3 });
    assert.deepEqual(result.stagesCompleted, ['stage1', 'stage2', 'stage3']);
  });

  it('marks deep-analysis stages from the profile', async () => {
    const profile = loadProfile('babok');
    const modes = {};
    await runPipeline('BABOK-19700101-ENG3', {
      dryRun: true,
      profile,
      onProgress: (e) => { if (e.type === 'stage_started') modes[e.stage] = e.mode; },
    });
    for (const n of profile.orchestrator.deep_analysis_stages) {
      assert.equal(modes[`stage${n}`], 'deep_analysis', `stage${n} should be deep`);
    }
    assert.equal(modes.stage1, 'standard');
  });
});
