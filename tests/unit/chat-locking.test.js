import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createJournal, readJournal } from '../../cli/src/journal.js';
import { getProjectDir } from '../../cli/src/project.js';
import { switchChatStage } from '../../cli/src/commands/chat.js';
import { refreshLock, withStageLock } from '../../cli/src/lock.js';

let tmpBase;
let originalCwd;

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-chat-lock-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase);
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

describe('stage locking helpers', () => {
  it('refreshes and releases lease-based stage locks', async () => {
    const projectId = 'BABOK-19700101-LOCK';
    createJournal(projectId, 'Lock Test', 'EN');
    const projectDir = getProjectDir(projectId);
    const lockPath = path.join(projectDir, '.stage_1.lock');

    await withStageLock(projectId, 1, async () => {
      assert.ok(fs.existsSync(lockPath));
      const beforeRefresh = JSON.parse(fs.readFileSync(lockPath, 'utf-8')).locked_at;
      let afterRefresh = beforeRefresh;
      for (let attempt = 0; attempt < 5 && afterRefresh === beforeRefresh; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 5));
        assert.equal(refreshLock(projectId, 1), true);
        afterRefresh = JSON.parse(fs.readFileSync(lockPath, 'utf-8')).locked_at;
      }
      assert.notEqual(afterRefresh, beforeRefresh);
    });

    assert.equal(fs.existsSync(lockPath), false);
  });
});

describe('chat stage switching', () => {
  it('persists the previous stage and loads bounded history for the next stage', async () => {
    const projectId = 'BABOK-19700101-CHAT';
    const journal = createJournal(projectId, 'Chat Test', 'EN');
    const projectDir = getProjectDir(projectId);
    const chatDir = path.join(projectDir, 'chat_history');
    fs.mkdirSync(chatDir, { recursive: true });

    fs.writeFileSync(path.join(chatDir, 'stage_2.json'), JSON.stringify({
      project_id: projectId,
      stage: 2,
      updated_at: new Date().toISOString(),
      message_count: 10,
      messages: Array.from({ length: 10 }, (_, index) => ({
        role: index % 2 === 0 ? 'user' : 'model',
        parts: [{ text: `Message ${index + 1} with KPI-1 and 2026-01-01` }],
      })),
    }, null, 2));

    const currentMessages = [
      { role: 'user', parts: [{ text: 'Please analyse stage 1.' }] },
      { role: 'model', parts: [{ text: 'Stage 1 analysis draft.' }] },
    ];

    const result = await switchChatStage(projectId, journal, 1, 2, currentMessages);

    const savedStage1 = JSON.parse(fs.readFileSync(path.join(chatDir, 'stage_1.json'), 'utf-8'));
    assert.equal(savedStage1.message_count, 2);
    assert.deepEqual(savedStage1.messages, currentMessages);

    const updatedJournal = readJournal(projectId);
    const stage1 = updatedJournal.stages.find(stage => stage.stage === 1);
    assert.equal(stage1.chat_message_count, 2);

    assert.equal(result.stageNumber, 2);
    assert.equal(result.messages.length, 10);
    assert.equal(result.recentMessages.length, 8);
    assert.match(result.systemPrompt, /Earlier Conversation Summary:/);
  });
});
