/**
 * Integration tests for real approveStage path in CLI and babok-mcp.
 * Verifies that approveStage enforces Two-Key deliverable inspection,
 * rejecting mock hashes (1111...) and invalid review_id formats,
 * while allowing valid deliverable submissions.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import * as cliJournal from '../../cli/src/journal.js';
import * as mcpJournal from '../../babok-mcp/src/lib/journal.js';
import { sha256Content, generateReviewId } from '../../cli/src/two-key-gate.js';
import { getProjectDir } from '../../cli/src/project.js';

describe('real approveStage integration (CLI and MCP paths)', () => {
  let tmpBase;
  let originalCwd;

  before(() => {
    originalCwd = process.cwd();
    tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-approve-int-'));
    fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
    process.chdir(tmpBase);
  });

  after(() => {
    process.chdir(originalCwd);
    if (tmpBase) {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  describe('CLI approveStage path', () => {
    const PROJ_ID = 'BABOK-20261016-CLI1';

    test('rejects deliverable containing mock repeated-character hash (1111...)', () => {
      cliJournal.createJournal(PROJ_ID, 'CLI Test Project');
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const mockContent = '# Charter\n\n## Approval\nAttestation hash: 1111111111111111111111111111111111111111111111111111111111111111\n';
      fs.writeFileSync(stage0File, mockContent, 'utf8');

      const sha = sha256Content(mockContent);
      const reviewId = generateReviewId();
      cliJournal.submitForReview(PROJ_ID, 0, sha, reviewId);
      cliJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      assert.throws(
        () => cliJournal.approveStage(PROJ_ID, 0, 'Approve test', sha),
        /Two-Key Gate: stage 0 deliverable contains a mock repeated-character hash/
      );
    });

    test('rejects stage with invalid review_id format', () => {
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const cleanContent = '# Charter\n\n## Summary\nValid charter without mock hashes.\n';
      fs.writeFileSync(stage0File, cleanContent, 'utf8');

      const sha = sha256Content(cleanContent);
      const validReviewId = generateReviewId();
      cliJournal.submitForReview(PROJ_ID, 0, sha, validReviewId);
      cliJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      // Simulate a journal with an invalid review_id (e.g. from external/manual script)
      const journal = cliJournal.readJournal(PROJ_ID);
      journal.stages[0].agent_submission.review_id = 'rev-invalid-format-id';
      cliJournal.writeJournal(PROJ_ID, journal);

      assert.throws(
        () => cliJournal.approveStage(PROJ_ID, 0, 'Approve test', sha),
        /invalid review_id format for stage 0/
      );
    });

    test('approves valid stage when deliverable and review_id are correct', () => {
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const cleanContent = '# Charter\n\n## Summary\nValid charter deliverable content.\n';
      fs.writeFileSync(stage0File, cleanContent, 'utf8');

      const sha = sha256Content(cleanContent);
      const reviewId = generateReviewId();
      cliJournal.submitForReview(PROJ_ID, 0, sha, reviewId);
      cliJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      const approvedJournal = cliJournal.approveStage(PROJ_ID, 0, 'Charter approved', sha);
      const stage0 = approvedJournal.stages.find(s => s.stage === 0);
      assert.equal(stage0.status, 'approved');
      assert.ok(stage0.approved_at);
      assert.equal(stage0.approved_by, 'Human');
    });
  });

  describe('MCP approveStage path', () => {
    const PROJ_ID = 'BABOK-20261016-MCP1';

    test('rejects deliverable containing mock repeated-character hash (2222...)', () => {
      mcpJournal.createJournal(PROJ_ID, 'MCP Test Project');
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const mockContent = '# Charter\n\n## Approval\nAttestation hash: 2222222222222222222222222222222222222222222222222222222222222222\n';
      fs.writeFileSync(stage0File, mockContent, 'utf8');

      const sha = sha256Content(mockContent);
      const reviewId = generateReviewId();
      mcpJournal.submitForReview(PROJ_ID, 0, sha, reviewId);
      mcpJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      assert.throws(
        () => mcpJournal.approveStage(PROJ_ID, 0, 'Approve test', sha),
        /Two-Key Gate: stage 0 deliverable contains a mock repeated-character hash/
      );
    });

    test('rejects stage with invalid review_id format', () => {
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const cleanContent = '# Charter\n\n## Summary\nValid MCP charter content.\n';
      fs.writeFileSync(stage0File, cleanContent, 'utf8');

      const sha = sha256Content(cleanContent);
      const validReviewId = generateReviewId();
      mcpJournal.submitForReview(PROJ_ID, 0, sha, validReviewId);
      mcpJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      // Simulate a journal with an invalid review_id (e.g. from external/manual script)
      const journal = mcpJournal.readJournal(PROJ_ID);
      journal.stages[0].agent_submission.review_id = 'rev-consulting-invalid-s0';
      mcpJournal.writeJournal(PROJ_ID, journal);

      assert.throws(
        () => mcpJournal.approveStage(PROJ_ID, 0, 'Approve test', sha),
        /invalid review_id format for stage 0/
      );
    });

    test('approves valid stage when deliverable and review_id are correct', () => {
      const projectDir = getProjectDir(PROJ_ID);
      const stage0File = path.join(projectDir, 'STAGE_00_Project_Charter.md');

      const cleanContent = '# Charter\n\n## Summary\nValid MCP charter deliverable.\n';
      fs.writeFileSync(stage0File, cleanContent, 'utf8');

      const sha = sha256Content(cleanContent);
      const reviewId = generateReviewId();
      mcpJournal.submitForReview(PROJ_ID, 0, sha, reviewId);
      mcpJournal.attestStage(PROJ_ID, 0, 'Human', true, sha);

      const approvedJournal = mcpJournal.approveStage(PROJ_ID, 0, 'MCP Charter approved', sha);
      const stage0 = approvedJournal.stages.find(s => s.stage === 0);
      assert.equal(stage0.status, 'approved');
      assert.ok(stage0.approved_at);
      assert.equal(stage0.approved_by, 'Human');
    });
  });
});
