import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (...segments) => fs.readFileSync(path.join(root, ...segments), 'utf8');

const analysisPolicy = read('BABOK_AGENT', 'analysis-policy.md');
const babokPrompt = read('BABOK_AGENT', 'BABOK_Agent_System_Prompt.md');
const consultingPrompt = read('profiles', 'consulting', 'Consulting_Agent_System_Prompt.md');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertContains(haystack, needles, label) {
  for (const needle of needles) {
    assert.match(haystack, new RegExp(escapeRegExp(needle), 'i'), `${label} is missing: ${needle}`);
  }
}

test('shared analysis policy defines the analytical contract', () => {
  assertContains(
    analysisPolicy,
    [
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
      'Traceability',
      'Blocking',
    ],
    'analysis-policy.md',
  );
});

test('shared analysis policy is profile-neutral', () => {
  for (const profileSpecific of ['STAGE_00_', 'BABOK-YYYYMMDD', 'profiles/consulting/stages']) {
    assert.doesNotMatch(
      analysisPolicy,
      new RegExp(escapeRegExp(profileSpecific), 'i'),
      `analysis-policy.md must stay profile-neutral: ${profileSpecific}`,
    );
  }
});

test('every profile system prompt delegates to the shared policies', () => {
  for (const [label, prompt] of [['babok', babokPrompt], ['consulting', consultingPrompt]]) {
    assert.match(
      prompt,
      /BABOK_AGENT\/analysis-policy\.md/,
      `${label} system prompt must reference the shared analysis policy`,
    );
    assert.match(
      prompt,
      /BABOK_AGENT\/elicitation-policy\.md/,
      `${label} system prompt must reference the shared elicitation policy`,
    );
  }
});

test('shared policy is not duplicated inside the profile system prompts', () => {
  for (const [label, prompt] of [['babok', babokPrompt], ['consulting', consultingPrompt]]) {
    assert.doesNotMatch(
      prompt,
      /^#{2,3} .*Depth Gate\s*$/im,
      `${label} system prompt must not redefine the Depth Gate`,
    );
  }
});

test('BABOK system prompt keeps the profile-specific lifecycle', () => {
  for (let stage = 0; stage <= 8; stage += 1) {
    assert.match(babokPrompt, new RegExp(`Stage ${stage}\\b`), `missing Stage ${stage}`);
  }
  assert.match(babokPrompt, /projects\/<project_id>\//);

  const saveIndex = babokPrompt.indexOf('babok_save_deliverable');
  const submitIndex = babokPrompt.indexOf('babok_submit_for_review');
  const approveIndex = babokPrompt.indexOf('babok approve');
  assert.ok(saveIndex >= 0 && saveIndex < submitIndex, 'deliverable must be saved before submission');
  assert.ok(submitIndex < approveIndex, 'submission must precede human approval');
});

test('prompts exclude obsolete and speculative instructions', () => {
  for (const source of [analysisPolicy, babokPrompt]) {
    for (const forbidden of [
      '/mnt/user-data/outputs/BABOK_Analysis',
      'would follow similar structure',
      'GPT-4',
      'Claude 3',
      'Gemini 1.5',
    ]) {
      assert.doesNotMatch(source, new RegExp(escapeRegExp(forbidden), 'i'), `obsolete content: ${forbidden}`);
    }
  }
});

test('every runtime surface injects the shared analysis policy', () => {
  const surfaces = [
    ['web/lib/stage-chat.ts', ['web', 'lib', 'stage-chat.ts']],
    ['cli/src/commands/chat.js', ['cli', 'src', 'commands', 'chat.js']],
    ['cli/src/generation/prompt-builder.js', ['cli', 'src', 'generation', 'prompt-builder.js']],
    ['babok-mcp/src/lib/project.js', ['babok-mcp', 'src', 'lib', 'project.js']],
  ];

  for (const [label, segments] of surfaces) {
    const source = read(...segments);
    assert.match(
      source,
      /analysis-policy(\.md)?|loadAnalysisPolicy|analysisPolicy/,
      `${label} must inject the shared analysis policy`,
    );
  }
});

test('plugin instruction surfaces reference the shared analysis policy', () => {
  for (const [label, segments] of [
    ['AGENTS.md', ['AGENTS.md']],
    ['skills/babok-analyst/SKILL.md', ['skills', 'babok-analyst', 'SKILL.md']],
    ['.github/copilot-instructions.md', ['.github', 'copilot-instructions.md']],
    ['hooks/babok-instructions.cjs', ['hooks', 'babok-instructions.cjs']],
  ]) {
    assert.match(read(...segments), /analysis-policy\.md/, `${label} must reference the shared analysis policy`);
  }
});
