import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const prompt = fs.readFileSync(
  path.join(root, 'BABOK_AGENT', 'BABOK_Agent_System_Prompt.md'),
  'utf8',
);

test('system prompt defines the analytical quality contract', () => {
  for (const required of [
    '[FACT]',
    '[STAKEHOLDER CLAIM]',
    '[CALCULATION]',
    '[INFERENCE]',
    '[HYPOTHESIS]',
    '[ASSUMPTION]',
    '[UNKNOWN]',
    'Evidence → Interpretation → Implication → Recommendation',
    'Competing hypotheses',
    'Deep Market Analysis',
    'Depth Gate',
    'Two-Key Journal',
    'projects/<project_id>/',
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required), 'i'), `missing analytical contract: ${required}`);
  }
});

test('system prompt covers the current Stage 0-8 lifecycle', () => {
  for (let stage = 0; stage <= 8; stage += 1) {
    assert.match(prompt, new RegExp(`(?:Stage|Etap) ${stage}\\b`, 'i'), `missing Stage ${stage}`);
  }

  const saveIndex = prompt.indexOf('babok_save_deliverable');
  const submitIndex = prompt.indexOf('babok_submit_for_review');
  const approveIndex = prompt.indexOf('babok approve');
  assert.ok(saveIndex >= 0 && saveIndex < submitIndex, 'deliverable must be saved before submission');
  assert.ok(submitIndex < approveIndex, 'submission must precede human approval');
});

test('system prompt excludes obsolete and speculative instructions', () => {
  for (const forbidden of [
    '/mnt/user-data/outputs/BABOK_Analysis',
    'would follow similar structure',
    'GPT-4',
    'Claude 3',
    'Gemini 1.5',
  ]) {
    assert.doesNotMatch(prompt, new RegExp(escapeRegExp(forbidden), 'i'), `obsolete content found: ${forbidden}`);
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
