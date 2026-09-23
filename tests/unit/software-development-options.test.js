/**
 * Options recommender (Stage 3): mocked-llmClient unit tests plus a real
 * end-to-end test against the OpenAI key the user just configured — draft
 * generation AND the independent critique pass are both real model calls,
 * not simulated.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { recommendOptions } from '../../cli/src/software-development/options-recommender.js';
import { getApiKey, createLlmClient, PROVIDERS } from '../../cli/src/llm.js';

function fakeLlmClient(responses) {
  let call = 0;
  return {
    modelName: 'fake-model',
    chat: async () => {
      const r = responses[call];
      call += 1;
      return r;
    },
  };
}

const SAMPLE_DRAFT = {
  reuse_assessment: 'None — no existing saved-payment mechanism found in the evidence.',
  options: [
    { id: 'OPT-00', summary: 'Do nothing', addresses: [] },
    { id: 'OPT-01', summary: 'Store tokenised card refs in checkout-service', addresses: ['FR gap 1'] },
    { id: 'OPT-02', summary: 'Delegate to PSP-hosted vault', addresses: ['FR gap 1'] },
  ],
  evaluation_criteria: [
    { criterion: 'Effort', weight: 40, source: 'Stage 0 budget' },
    { criterion: 'Risk', weight: 60, source: 'Stage 0 risk appetite' },
  ],
  evaluation_matrix: [
    { option_id: 'OPT-00', scores: { Effort: 100, Risk: 0 }, weighted_total: 40 },
    { option_id: 'OPT-01', scores: { Effort: 60, Risk: 70 }, weighted_total: 66 },
    { option_id: 'OPT-02', scores: { Effort: 80, Risk: 90 }, weighted_total: 86 },
  ],
  recommended_option_id: 'OPT-02',
  recommendation_rationale: 'OPT-02 scores 86 vs OPT-01\'s 66.',
  adrs: [{ id: 'ADR-01', context: 'x', decision: 'y', consequences: 'z', alternatives_considered: 'OPT-01', related_requirements: ['FR-001'] }],
  compatibility_migration_approach: 'No breaking change to the public API.',
};

describe('options-recommender (mocked llmClient)', () => {
  it('throws a clear error when no llmClient is provided', async () => {
    await assert.rejects(
      () => recommendOptions({ baseline: { evidence: [] }, changeGoal: 'x', llmClient: null }),
      /an llmClient is required/,
    );
  });

  it('parses a draft and applies the critique\'s correction when one is returned', async () => {
    const corrected = { ...SAMPLE_DRAFT, recommendation_rationale: 'Corrected: OPT-02 scores 86 vs 66, with weights re-verified.' };
    const llmClient = fakeLlmClient([
      JSON.stringify(SAMPLE_DRAFT),
      JSON.stringify({ issues: [{ severity: 'minor', description: 'Rationale did not restate weights precisely.' }], corrected_draft: corrected }),
    ]);
    const result = await recommendOptions({ baseline: { evidence: [{ id: 'EV-001', claim: 'x' }] }, changeGoal: 'Add saved payment methods', llmClient });
    assert.equal(result.critique.corrected, true);
    assert.equal(result.final.recommendation_rationale, corrected.recommendation_rationale);
    assert.equal(result.critique.issues.length, 1);
  });

  it('keeps the draft when the critique finds no issues (corrected_draft: null)', async () => {
    const llmClient = fakeLlmClient([JSON.stringify(SAMPLE_DRAFT), JSON.stringify({ issues: [], corrected_draft: null })]);
    const result = await recommendOptions({ baseline: { evidence: [] }, changeGoal: 'x', llmClient });
    assert.equal(result.critique.corrected, false);
    assert.deepEqual(result.final, SAMPLE_DRAFT);
  });

  it('parses a draft wrapped in a markdown code fence', async () => {
    const llmClient = fakeLlmClient([`Here is the JSON:\n\`\`\`json\n${JSON.stringify(SAMPLE_DRAFT)}\n\`\`\``, JSON.stringify({ issues: [], corrected_draft: null })]);
    const result = await recommendOptions({ baseline: { evidence: [] }, changeGoal: 'x', llmClient });
    assert.equal(result.draft.recommended_option_id, 'OPT-02');
  });

  it('throws a clear error when the model response has no JSON object at all', async () => {
    const llmClient = fakeLlmClient(['Sorry, I cannot help with that.']);
    await assert.rejects(
      () => recommendOptions({ baseline: { evidence: [] }, changeGoal: 'x', llmClient }),
      /did not contain a JSON object/,
    );
  });
});

function openAiConfigured() {
  try { return Boolean(getApiKey('openai')); } catch { return false; }
}
const skipReason = openAiConfigured() ? false : 'No OpenAI API key is configured in this environment (babok setup / Web AI Settings)';

describe('options-recommender (live OpenAI)', { skip: skipReason }, () => {
  it('generates a real, evidence-grounded Stage 3 recommendation with a real independent critique pass', async () => {
    const apiKey = getApiKey('openai');
    const llmClient = createLlmClient('openai', apiKey, PROVIDERS.openai.defaultModel);

    const baseline = {
      narrative: null,
      evidence: [
        { id: 'EV-001', claim: 'npm package "babok-analyst": monorepo root with workspaces for cli/, babok-mcp/, web/' },
        { id: 'EV-002', claim: 'CI/CD configuration present: .github/workflows/lint-prompts.yml' },
        { id: 'EV-003', claim: 'Likely test directory: tests' },
        { id: 'EV-004', claim: 'cli/src/software-development/hosting/github.js provides read-only GitHub access via the gh CLI; no write/publish methods exist yet' },
      ],
    };

    const result = await recommendOptions({
      baseline,
      changeGoal: 'Add the ability to publish a pull request to a GitHub repository from the software-development profile\'s execution step, after explicit human authorisation.',
      constraints: ['Must not auto-merge or deploy anything', 'Must reuse the existing read-only GitHub connector rather than a second HTTP client'],
      llmClient,
    });

    assert.ok(Array.isArray(result.draft.options) && result.draft.options.length >= 2, 'expected at least 2 real options plus OPT-00');
    assert.ok(result.draft.options.some(o => o.id === 'OPT-00'), 'expected an explicit do-nothing/defer option');
    assert.ok(typeof result.draft.recommended_option_id === 'string' && result.draft.recommended_option_id.length > 0);
    assert.ok(Array.isArray(result.draft.adrs) && result.draft.adrs.length > 0, 'expected at least one ADR');
    assert.ok(Array.isArray(result.critique.issues), 'expected the real critique call to return an issues array (possibly empty)');
    assert.equal(result.model, PROVIDERS.openai.defaultModel);

    const weightSum = result.final.evaluation_criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
    assert.ok(weightSum >= 95 && weightSum <= 105, `expected evaluation weights to sum to ~100, got ${weightSum}`);
  });
});
