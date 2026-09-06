/**
 * Unit tests for the LLM-judged depth/specificity check
 * (cli/src/quality/checks/depth.js). The LLM is always a mock here.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { checkDepth } from '../../cli/src/quality/checks/depth.js';

describe('checkDepth', () => {
  test('returns a neutral pass-through score when no llmClient is provided', async () => {
    const result = await checkDepth('some content', { stageNumber: 4 });
    assert.equal(result.score, 100);
    assert.deepEqual(result.issues, []);
  });

  test('parses a well-formed JSON judge response', async () => {
    const llmClient = {
      chat: async () => JSON.stringify({
        score: 62,
        findings: [{ section: 'Functional Requirements (FR-NNN)', issue: 'Generic placeholder text, not tied to the stated industry.' }],
      }),
    };
    const result = await checkDepth('draft content', { stageNumber: 4, llmClient });
    assert.equal(result.score, 62);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].dimension, 'depth');
    assert.match(result.issues[0].message, /Functional Requirements/);
  });

  test('handles a fenced ```json response', async () => {
    const llmClient = {
      chat: async () => '```json\n{"score": 88, "findings": []}\n```',
    };
    const result = await checkDepth('draft content', { stageNumber: 1, llmClient });
    assert.equal(result.score, 88);
    assert.deepEqual(result.issues, []);
  });

  test('clamps out-of-range scores into [0, 100]', async () => {
    const llmClient = { chat: async () => JSON.stringify({ score: 140, findings: [] }) };
    const result = await checkDepth('x', { stageNumber: 1, llmClient });
    assert.equal(result.score, 100);
  });

  test('falls back to a neutral score with a warning issue on unparseable response', async () => {
    const llmClient = { chat: async () => 'not json at all' };
    const result = await checkDepth('x', { stageNumber: 1, llmClient });
    assert.equal(result.score, 50);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].ruleId, 'DEPTH-JUDGE-ERROR');
  });

  test('falls back gracefully when llmClient.chat throws', async () => {
    const llmClient = { chat: async () => { throw new Error('network error'); } };
    const result = await checkDepth('x', { stageNumber: 1, llmClient });
    assert.equal(result.score, 50);
    assert.equal(result.issues[0].ruleId, 'DEPTH-JUDGE-ERROR');
  });

  test('passes sectionsScope through into the user message', async () => {
    let capturedUserMessage = '';
    const llmClient = {
      chat: async (systemPrompt, userMessage) => {
        capturedUserMessage = userMessage;
        return JSON.stringify({ score: 100, findings: [] });
      },
    };
    await checkDepth('x', { stageNumber: 4, llmClient, sectionsScope: ['Functional Requirements (FR-NNN)'] });
    assert.match(capturedUserMessage, /Functional Requirements \(FR-NNN\)/);
  });
});
