import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { StageActionError, runStageAction } from '../../web/lib/stage-actions.ts';
import { saveStageDraft, StageContentError } from '../../web/lib/stage-content.ts';
import {
  generateStageDraftFromChat,
  getStageChatHistory,
  sendStageChatMessage,
} from '../../web/lib/stage-chat.ts';

function writeFixture({
  prefix = 'BABOK',
  profile = 'babok',
  stage = {},
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-web-'));
  const projectsDir = path.join(root, 'projects');
  const profilesDir = path.join(root, 'profiles');
  const projectId = `${prefix}-20260922-TEST`;
  const projectDir = path.join(projectsDir, projectId);
  const deliverableFile = profile === 'consulting'
    ? 'STAGE_00_Engagement_Charter.md'
    : 'STAGE_00_Project_Charter.md';
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(path.join(profilesDir, profile), { recursive: true });
  fs.writeFileSync(
    path.join(profilesDir, profile, 'profile.json'),
    JSON.stringify({
      paths: {
        system_prompt: `${profile}/system.md`,
        stages_dir: `${profile}/stages`,
      },
      stages: [{ stage: 0, deliverable_file: deliverableFile, prompt_file: 'stage_0.md' }],
    }),
  );
  fs.mkdirSync(path.join(root, profile, 'stages'), { recursive: true });
  fs.writeFileSync(path.join(root, profile, 'system.md'), 'SYSTEM');
  fs.writeFileSync(path.join(root, profile, 'stages', 'stage_0.md'), 'STAGE');
  fs.writeFileSync(
    path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`),
    JSON.stringify({
      project_id: projectId,
      project_name: 'Test project',
      profile,
      language: 'EN',
      decisions: [],
      assumptions: [],
      open_questions: [],
      stages: [{
        stage: 0,
        name: 'Stage zero',
        status: 'in_progress',
        ...stage,
      }],
    }),
  );
  return { root, projectsDir, profilesDir, projectId, projectDir, deliverableFile };
}

describe('web stage action delegation', () => {
  it('routes approve requests through the CLI approval command', async () => {
    const calls = [];
    await runStageAction('BABOK-20260922-ABCD', 0, 'approve', undefined, async (...args) => {
      calls.push(args);
      return { stdout: '', stderr: '' };
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
    assert.deepEqual(calls[0][1].slice(1), [
      'reject',
      'BABOK-20260922-ABCD',
      '2',
      '--reason',
      'Rejected via Web UI',
    ]);
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
        return true;
      },
    );
  });
});

describe('web stage draft persistence', () => {
  it('saves consulting content in the profile deliverable and updates the journal', () => {
    const fixture = writeFixture({ prefix: 'BC', profile: 'consulting' });
    try {
      const result = saveStageDraft(fixture.projectId, 0, '# Engagement charter', fixture);
      assert.equal(result.fileName, fixture.deliverableFile);
      assert.equal(
        fs.readFileSync(path.join(fixture.projectDir, result.fileName), 'utf8'),
        '# Engagement charter',
      );
      const journal = JSON.parse(
        fs.readFileSync(path.join(fixture.projectDir, `PROJECT_JOURNAL_${fixture.projectId}.json`), 'utf8'),
      );
      assert.equal(journal.stages[0].status, 'in_progress');
      assert.equal(journal.stages[0].deliverable_file, result.fileName);
      assert.equal(journal.stages[0].agent_submission, null);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('does not overwrite content for an approved stage without an open revision', () => {
    const fixture = writeFixture({
      stage: { status: 'approved', revision_open: false, deliverable_file: 'STAGE_00_Project_Charter.md' },
    });
    const deliverablePath = path.join(fixture.projectDir, fixture.deliverableFile);
    fs.writeFileSync(deliverablePath, 'approved content');
    try {
      assert.throws(
        () => saveStageDraft(fixture.projectId, 0, 'changed content', fixture),
        (error) => error instanceof StageContentError && error.status === 409,
      );
      assert.equal(fs.readFileSync(deliverablePath, 'utf8'), 'approved content');
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('does not overwrite a stage locked by another editor', () => {
    const fixture = writeFixture();
    fs.writeFileSync(
      path.join(fixture.projectDir, '.stage_0.lock'),
      JSON.stringify({
        locked_by: 'CLI user',
        hostname: 'workstation',
        pid: 42,
        locked_at: new Date().toISOString(),
      }),
    );
    try {
      assert.throws(
        () => saveStageDraft(fixture.projectId, 0, 'changed content', fixture),
        (error) => error instanceof StageContentError && error.status === 409,
      );
      assert.equal(fs.existsSync(path.join(fixture.projectDir, fixture.deliverableFile)), false);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

describe('web AI stage interview', () => {
  it('persists shared chat history and generates a draft from evidence', async () => {
    const fixture = writeFixture({ prefix: 'BC', profile: 'consulting' });
    const prompts = [];
    const agentRunner = async (systemPrompt, userPrompt) => {
      prompts.push({ systemPrompt, userPrompt });
      return {
        provider: 'Mock LLM',
        text: userPrompt.includes('Generate the complete stage deliverable')
          ? '# Engagement Charter\n\nEvidence-based draft.'
          : 'What business outcome should this engagement achieve?',
      };
    };
    const options = { ...fixture, repositoryRoot: fixture.root, agentRunner };

    try {
      const reply = await sendStageChatMessage(fixture.projectId, 0, 'Let us begin.', options);
      assert.equal(reply.provider, 'Mock LLM');
      assert.match(reply.message.parts[0].text, /business outcome/);
      assert.match(prompts[0].systemPrompt, /Ask exactly one concise question/);

      const history = getStageChatHistory(fixture.projectId, 0, options);
      assert.deepEqual(history.map((message) => message.role), ['user', 'model']);
      assert.equal(history[0].parts[0].text, 'Let us begin.');

      const generated = await generateStageDraftFromChat(fixture.projectId, 0, options);
      assert.match(generated.draft, /^# Engagement Charter/);
      assert.equal(
        fs.readFileSync(path.join(fixture.projectDir, fixture.deliverableFile), 'utf8'),
        generated.draft,
      );
      assert.match(prompts[1].userPrompt, /Let us begin/);
      assert.match(prompts[1].userPrompt, /What business outcome/);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
