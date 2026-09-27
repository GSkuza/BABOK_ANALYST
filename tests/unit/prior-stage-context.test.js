import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildPriorStageContext, stripBoilerplateSections } from '../../cli/src/prior-stage-context.js';
import { buildContextPrompt, loadPriorStageContext } from '../../cli/src/commands/chat.js';

describe('prior-stage context builder', () => {
  it('returns an empty string when no earlier stage has content', () => {
    assert.equal(buildPriorStageContext([], { currentStage: 2 }), '');
    assert.equal(buildPriorStageContext([
      { stage: 0, status: 'not_started', content: '# Draft' },
      { stage: 1, status: 'approved', content: null },
      { stage: 2, status: 'approved', content: '# Same stage' },
      { stage: 3, status: 'approved', content: '# Later stage' },
    ], { currentStage: 2 }), '');
  });

  it('orders stages, labels status and strips sign-off boilerplate', () => {
    const block = buildPriorStageContext([
      { stage: 1, name: 'Init', status: 'completed', content: '# S1\n\n## KPIs\n\nOTIF 95%\n\n## Quality Checklist\n\n- [x] done' },
      { stage: 0, name: 'Charter', status: 'approved', content: '# S0\n\n## Scope\n\nTrucks only\n\n## ✅ Zatwierdzenie\n\nPodpis' },
    ], { currentStage: 2 });
    assert.ok(block.indexOf('Stage 0: Charter [APPROVED') < block.indexOf('Stage 1: Init [SUBMITTED'));
    assert.match(block, /Trucks only/);
    assert.match(block, /OTIF 95%/);
    assert.doesNotMatch(block, /Podpis|- \[x\] done/);
    assert.match(block, /Never ask the human for information these documents already contain/);
  });

  it('keeps content headings that merely mention approval', () => {
    const text = stripBoilerplateSections('## Approval workflow (AS-IS)\n\nManager signs PO.\n\n## Approval\n\nSigned.');
    assert.match(text, /Manager signs PO/);
    assert.doesNotMatch(text, /Signed\./);
  });

  it('truncates older stages first when over budget', () => {
    const block = buildPriorStageContext([
      { stage: 0, status: 'approved', content: `OLD ${'a'.repeat(5000)}` },
      { stage: 1, status: 'approved', content: `NEW ${'b'.repeat(5000)} END-OF-NEWEST` },
    ], { currentStage: 2, maxChars: 7000 });
    assert.match(block, /END-OF-NEWEST/);
    assert.match(block, /characters omitted to fit the context budget/);
  });
});

describe('CLI chat prior-stage context', () => {
  it('injects earlier deliverables into the interview system prompt', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-prior-'));
    try {
      fs.writeFileSync(path.join(dir, 'STAGE_00_Project_Charter.md'), '# Charter\n\n## Scope\n\nOnly the Gdańsk plant.\n');
      const journal = {
        project_id: 'BABOK-20260101-TEST',
        project_name: 'Test',
        profile: 'babok',
        language: 'EN',
        created_at: '2026-01-01',
        decisions: [],
        assumptions: [],
        open_questions: [],
        stages: [
          { stage: 0, name: 'Project Charter', status: 'approved' },
          { stage: 1, name: 'Project Initialization', status: 'in_progress' },
        ],
      };
      assert.match(loadPriorStageContext(journal, 1, dir), /Only the Gdańsk plant/);
      assert.equal(loadPriorStageContext(journal, 0, dir), '');
      assert.match(buildContextPrompt(journal, 1, '', dir), /PRIOR-STAGE DELIVERABLES[\s\S]*Only the Gdańsk plant[\s\S]*=== PROJECT CONTEXT ===/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
