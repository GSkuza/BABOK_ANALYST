/**
 * Integration test: CLI project workflow
 * Tests the full journal lifecycle: create → approve → verify state
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

// We test the real journal functions through a temp CWD with a 'projects' folder
import {
  createJournal,
  readJournal,
  approveStage,
  rejectStage,
  updateStageStatus,
} from '../../cli/src/journal.js';

describe('CLI workflow: project lifecycle integration', () => {
  let tmpBase;
  let originalCwd;
  const PROJECT_ID = 'BABOK-19700101-WFLW';

  before(() => {
    originalCwd = process.cwd();
    tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-workflow-test-'));
    fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
    process.chdir(tmpBase);
  });

  after(() => {
    process.chdir(originalCwd);
    if (tmpBase) fs.rmSync(tmpBase, { recursive: true, force: true });
  });

  test('step 1: create journal', () => {
    const journal = createJournal(PROJECT_ID, 'Workflow Test Project', 'EN');
    assert.ok(journal, 'Journal should be created');
    assert.equal(journal.project_id, PROJECT_ID);
    assert.equal(journal.project_name, 'Workflow Test Project');
    assert.equal(journal.language, 'EN');
    assert.equal(journal.current_stage, 0);
    assert.equal(journal.current_status, 'in_progress');
  });

  test('step 2: journal file exists on disk', () => {
    const journalPath = path.join(tmpBase, 'projects', PROJECT_ID, `PROJECT_JOURNAL_${PROJECT_ID}.json`);
    assert.ok(fs.existsSync(journalPath), 'Journal file should be on disk');
  });

  test('step 3: readJournal returns the created journal', () => {
    const journal = readJournal(PROJECT_ID);
    assert.equal(journal.project_id, PROJECT_ID);
    assert.equal(journal.stages.length, 9, 'Should have 9 stages');
  });

  test('step 4: stage 0 is in_progress after creation', () => {
    const journal = readJournal(PROJECT_ID);
    const stage0 = journal.stages.find(s => s.stage === 0);
    assert.equal(stage0.status, 'in_progress');
    assert.ok(stage0.started_at, 'Stage 0 should have started_at');
  });

  test('step 5: approve stage 0', () => {
    const updated = approveStage(PROJECT_ID, 0);
    const stage0 = updated.stages.find(s => s.stage === 0);
    assert.equal(stage0.status, 'approved');
    assert.ok(stage0.approved_at, 'Should have approved_at');
    assert.equal(stage0.approved_by, 'Human');
  });

  test('step 6: stage 1 is now in_progress after approving stage 0', () => {
    const journal = readJournal(PROJECT_ID);
    const stage1 = journal.stages.find(s => s.stage === 1);
    assert.equal(stage1.status, 'in_progress', 'Stage 1 should advance to in_progress');
    assert.equal(journal.current_stage, 1, 'current_stage should be 1');
  });

  test('step 7: approving already-approved stage throws', () => {
    assert.throws(
      () => approveStage(PROJECT_ID, 0),
      /already approved/i,
      'Should throw when approving an already-approved stage'
    );
  });

  test('step 8: reject stage 1 with reason', () => {
    const updated = rejectStage(PROJECT_ID, 1, 'Missing stakeholder analysis');
    const stage1 = updated.stages.find(s => s.stage === 1);
    assert.equal(stage1.status, 'rejected');
    assert.equal(stage1.notes, 'Missing stakeholder analysis');
  });

  test('step 9: updateStageStatus transitions stage 1 back to in_progress', () => {
    const updated = updateStageStatus(PROJECT_ID, 1, 'in_progress', 'Restarted after feedback');
    const stage1 = updated.stages.find(s => s.stage === 1);
    assert.equal(stage1.status, 'in_progress');
    assert.equal(stage1.notes, 'Restarted after feedback');
  });

  test('step 10: journal last_updated is a valid ISO timestamp', () => {
    const journal = readJournal(PROJECT_ID);
    assert.doesNotThrow(() => new Date(journal.last_updated), 'last_updated should be valid date');
    const ts = new Date(journal.last_updated).getTime();
    assert.ok(!isNaN(ts), 'Timestamp should be parseable');
    // Should be recent (within last 60 seconds)
    assert.ok(Date.now() - ts < 60_000, 'last_updated should be recent');
  });
});
