import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPreviousOutputsContext } from '../../cli/src/commands/run.js';

test('prepares complete source context locally, preserving facts beyond the old truncation limit', () => {
  const profile = { stages: [{ stage: 1, name: 'One' }, { stage: 2, name: 'Two' }] };
  const first = 'Context '.repeat(1000) + 'Budget ceiling: 123456 EUR';
  const context = buildPreviousOutputsContext({ 1: first, 2: 'Second stage evidence' }, profile);
  assert.equal(typeof context, 'string', 'no asynchronous summarizer or provider is needed');
  assert.ok(context.includes(first));
  assert.match(context, /Budget ceiling: 123456 EUR/);
  assert.match(context, /Stage 2: Two[\s\S]*Second stage evidence/);
  assert.equal(buildPreviousOutputsContext({}, profile), '');
});
