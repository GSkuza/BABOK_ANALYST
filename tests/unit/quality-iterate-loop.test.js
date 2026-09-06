/**
 * Unit tests for the generic bounded score->improve->rescore loop
 * (cli/src/quality/iterate-loop.js). Pure logic — no I/O, no LLM.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { iterateUntilThreshold } from '../../cli/src/quality/iterate-loop.js';

describe('iterateUntilThreshold', () => {
  test('passes immediately when the first score meets the threshold', async () => {
    let reviseCalls = 0;
    const result = await iterateUntilThreshold('draft-v1', {
      scoreFn: async () => ({ overall: 80 }),
      reviseFn: async () => { reviseCalls++; return 'draft-v2'; },
      threshold: 75,
      maxIterations: 3,
    });

    assert.equal(result.passed, true);
    assert.equal(result.escalated, false);
    assert.equal(result.iterations, 1);
    assert.equal(result.finalScore, 80);
    assert.equal(result.content, 'draft-v1');
    assert.equal(reviseCalls, 0, 'should not revise once threshold is met');
  });

  test('revises and rescopes content across iterations until it passes', async () => {
    const scores = [40, 60, 90];
    let call = 0;
    const result = await iterateUntilThreshold('v0', {
      scoreFn: async (content) => ({ overall: scores[call++], seenContent: content }),
      reviseFn: async (content) => content + '+revised',
      threshold: 75,
      maxIterations: 5,
    });

    assert.equal(result.passed, true);
    assert.equal(result.iterations, 3);
    assert.equal(result.finalScore, 90);
    assert.equal(result.content, 'v0+revised+revised');
  });

  test('escalates when maxIterations is exhausted without meeting threshold', async () => {
    const events = [];
    const result = await iterateUntilThreshold('v0', {
      scoreFn: async () => ({ overall: 30 }),
      reviseFn: async (content) => content + '+r',
      threshold: 75,
      maxIterations: 2,
      onIteration: (e) => events.push(e),
    });

    assert.equal(result.passed, false);
    assert.equal(result.escalated, true);
    assert.equal(result.iterations, 2);
    // one non-escalated event per iteration, plus one escalated event at the end
    assert.equal(events.filter(e => !e.escalated).length, 2);
    assert.equal(events.filter(e => e.escalated).length, 1);
  });

  test('falls back to defaultScore when scoreFn returns null/unparseable', async () => {
    const result = await iterateUntilThreshold('v0', {
      scoreFn: async () => null,
      reviseFn: async (content) => content,
      threshold: 75,
      maxIterations: 1,
      defaultScore: 42,
    });

    assert.equal(result.finalScore, 42);
    assert.equal(result.passed, false);
  });

  test('does not call reviseFn on the final iteration even if it fails', async () => {
    let reviseCalls = 0;
    await iterateUntilThreshold('v0', {
      scoreFn: async () => ({ overall: 10 }),
      reviseFn: async (content) => { reviseCalls++; return content; },
      threshold: 75,
      maxIterations: 3,
    });
    // revise happens after iterations 1 and 2, not after the last (3rd)
    assert.equal(reviseCalls, 2);
  });
});
