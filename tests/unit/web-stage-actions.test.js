import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { StageActionError, runStageAction } from '../../web/lib/stage-actions.ts';
import { saveStageDraft, StageContentError } from '../../web/lib/stage-content.ts';

describe('web stage action delegation', () => {
  it('routes approve requests through the CLI approval command', async () => {
    const calls = [];
    await runStageAction('BABOK-20260922-ABCD', 0, 'approve', undefined, async (...args) => {
      calls.push(args);
      return { stdout: '', stderr: '' };
    });

    describe('web stage draft persistence', () => {
      it('saves consulting content in the profile deliverable and updates the journal', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-web-draft-'));
        const projectsDir = path.join(root, 'projects');
        const profilesDir = path.join(root, 'profiles');
        const projectId = 'BC-20260922-AK4D';
        const projectDir = path.join(projectsDir, projectId);
        fs.mkdirSync(projectDir, { recursive: true });
        fs.mkdirSync(path.join(profilesDir, 'consulting'), { recursive: true });
        fs.writeFileSync(
          path.join(profilesDir, 'consulting', 'profile.json'),
          JSON.stringify({
            stages: [{ stage: 0, deliverable_file: 'STAGE_00_Engagement_Charter.md' }],
          }),
        );
        fs.writeFileSync(
          path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`),
          JSON.stringify({
            profile: 'consulting',
            stages: [{ stage: 0, status: 'not_started' }],
          }),
        );

        try {
          const result = saveStageDraft(projectId, 0, '# Engagement charter', { projectsDir, profilesDir });
          assert.equal(result.fileName, 'STAGE_00_Engagement_Charter.md');
          assert.equal(
            fs.readFileSync(path.join(projectDir, result.fileName), 'utf8'),
            '# Engagement charter',
          );
          const journal = JSON.parse(
            fs.readFileSync(path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`), 'utf8'),
          );
          assert.equal(journal.stages[0].status, 'in_progress');
          assert.equal(journal.stages[0].deliverable_file, result.fileName);
          assert.equal(journal.stages[0].agent_submission, null);
        } finally {
          fs.rmSync(root, { recursive: true, force: true });
        }
      });

      it('does not overwrite content for an approved stage without an open revision', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-web-locked-'));
        const projectsDir = path.join(root, 'projects');
        const profilesDir = path.join(root, 'profiles');
        const projectId = 'BABOK-20260922-ABCD';
        const projectDir = path.join(projectsDir, projectId);
        fs.mkdirSync(projectDir, { recursive: true });
        fs.mkdirSync(path.join(profilesDir, 'babok'), { recursive: true });
        fs.writeFileSync(
          path.join(profilesDir, 'babok', 'profile.json'),
          JSON.stringify({ stages: [{ stage: 0, deliverable_file: 'STAGE_00_Project_Charter.md' }] }),
        );
        fs.writeFileSync(
          path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`),
          JSON.stringify({
            profile: 'babok',
            stages: [{
              stage: 0,
              status: 'approved',
              revision_open: false,
              deliverable_file: 'STAGE_00_Project_Charter.md',
            }],
          }),
        );
        const deliverablePath = path.join(projectDir, 'STAGE_00_Project_Charter.md');
        fs.writeFileSync(deliverablePath, 'approved content');

        try {
          assert.throws(
            () => saveStageDraft(projectId, 0, 'changed content', { projectsDir, profilesDir }),
            (error) => error instanceof StageContentError && error.status === 409,
          );
          assert.equal(fs.readFileSync(deliverablePath, 'utf8'), 'approved content');
        } finally {
          fs.rmSync(root, { recursive: true, force: true });
        }
      });

      it('does not overwrite a stage locked by another editor', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-web-lock-'));
        const projectsDir = path.join(root, 'projects');
        const profilesDir = path.join(root, 'profiles');
        const projectId = 'BABOK-20260922-LOCK';
        const projectDir = path.join(projectsDir, projectId);
        fs.mkdirSync(projectDir, { recursive: true });
        fs.mkdirSync(path.join(profilesDir, 'babok'), { recursive: true });
        fs.writeFileSync(
          path.join(profilesDir, 'babok', 'profile.json'),
          JSON.stringify({ stages: [{ stage: 0, deliverable_file: 'STAGE_00_Project_Charter.md' }] }),
        );
        fs.writeFileSync(
          path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`),
          JSON.stringify({ profile: 'babok', stages: [{ stage: 0, status: 'in_progress' }] }),
        );
        fs.writeFileSync(
          path.join(projectDir, '.stage_0.lock'),
          JSON.stringify({
            locked_by: 'CLI user',
            hostname: 'workstation',
            pid: 42,
            locked_at: new Date().toISOString(),
          }),
        );

        try {
          assert.throws(
            () => saveStageDraft(projectId, 0, 'changed content', { projectsDir, profilesDir }),
            (error) => error instanceof StageContentError && error.status === 409,
          );
          assert.equal(fs.existsSync(path.join(projectDir, 'STAGE_00_Project_Charter.md')), false);
        } finally {
          fs.rmSync(root, { recursive: true, force: true });
        }
      });
    });

    assert.equal(calls.length, 1);
    const [cmd, argv, options] = calls[0];
    assert.equal(cmd, 'node');
    assert.deepEqual(argv.slice(1), ['approve', 'BABOK-20260922-ABCD', '0', '--attestor', 'Web UI']);
    assert.match(argv[0], /cli[\\/]bin[\\/]babok\.js$/);
    assert.equal(argv[0], path.join(options.cwd, 'cli', 'bin', 'babok.js'));
  });

  it('maps CLI failures to HTTP-friendly status codes', async () => {
    await assert.rejects(
      runStageAction('BABOK-20260922-ABCD', 0, 'approve', undefined, async () => {
        const error = new Error('failed');
        error.stderr = 'Error: Stage is already approved\n';
        throw error;
      }),
      (error) => {
        assert.ok(error instanceof StageActionError);
        assert.equal(error.status, 409);
        assert.equal(error.message, 'Stage is already approved');
        return true;
      },
    );
  });

  it('routes reject requests through the CLI reject command with a default reason', async () => {
    const calls = [];
    await runStageAction('BABOK-20260922-ABCD', 2, 'reject', undefined, async (...args) => {
      calls.push(args);
      return { stdout: '', stderr: '' };
    });

    assert.equal(calls.length, 1);
    const [, argv] = calls[0];
    assert.deepEqual(argv.slice(1), ['reject', 'BABOK-20260922-ABCD', '2', '--reason', 'Rejected via Web UI']);
  });

  it('maps ordinary CLI failures to status 400', async () => {
    await assert.rejects(
      runStageAction('BABOK-20260922-ABCD', 2, 'reject', 'Missing evidence', async () => {
        const error = new Error('failed');
        error.stderr = 'Error: Stage 2 is not approved\n';
        throw error;
      }),
      (error) => {
        assert.ok(error instanceof StageActionError);
        assert.equal(error.status, 400);
        assert.equal(error.message, 'Stage 2 is not approved');
        return true;
      },
    );
  });
});
