import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStagedDeliverable } from '../../cli/src/generation/staged-generator.js';
import { loadProfile, listProfileIds } from '../../cli/src/profiles.js';
import { loadRubric } from '../../cli/src/templates.js';

for (const profileId of listProfileIds()) {
  const profile = loadProfile(profileId);
  const rubric = loadRubric(profile);
  for (const [key, stageRubric] of Object.entries(rubric.stages)) {
    test(`${profileId} ${key}: exactly one call includes every section and instruction`, async () => {
      let calls = 0;
      let prompt;
      const chunks = [];
      const content = stageRubric.required_sections.map(section => `## ${section}\nSource: project context. Baseline 10 days; target 2 days by 2026-09-30.`).join('\n\n');
      const stageNumber = Number(key.replace('stage', ''));
      const result = await generateStagedDeliverable({
        stageNumber, profile, rubric, stageRubric,
        batchGroups: stageRubric.generation_batches,
        isDeepStage: profile.orchestrator.deep_analysis_stages.includes(stageNumber),
        systemPromptBase: 'PROJECT EVIDENCE: baseline provided by sponsor',
        userMessageIntro: 'Generate the complete document',
        llmClient: { chat: async (system, user, onChunk) => {
          calls++;
          prompt = system;
          onChunk(content);
          return content;
        } },
        options: { onProgress: event => { if (event.type === 'chunk') chunks.push(event.chunk); } },
      });
      assert.equal(calls, 1);
      assert.equal(result.finalDocument, content);
      assert.deepEqual(chunks, [content]);
      assert.equal(result.finalPass.mode, 'single_call');
      assert.equal(result.finalPass.validation, 'local');
      assert.match(prompt, /PROJECT EVIDENCE: baseline provided by sponsor/);
      for (const section of stageRubric.required_sections) assert.ok(prompt.includes(`## ${section}`));
      for (const group of stageRubric.generation_batches || []) {
        for (const section of group.sections) assert.ok(prompt.includes(`## ${section}`));
        if (group.instruction) assert.ok(prompt.includes(group.instruction));
      }
    });
  }
}

test('a low local score is reported without LLM judgement or revision', async () => {
  let calls = 0;
  const result = await generateStagedDeliverable({
    stageNumber: 4, isDeepStage: true,
    systemPromptBase: 'BASE', userMessageIntro: 'Generate',
    stageRubric: { required_sections: ['Required Section'] },
    rubric: { scoring: { min_overall_score: 99 } },
    llmClient: { chat: async () => { calls++; return 'Incomplete draft'; } },
    options: { maxBatchIterations: 99, maxFinalIterations: 99, classifyVerdict: () => { throw Error('must not classify'); } },
  });
  assert.equal(calls, 1);
  assert.equal(result.finalPass.passed, false);
  assert.equal(result.finalDocument, 'Incomplete draft');
  assert.ok(result.finalPass.issues.length > 0);
});

for (const response of ['   ', new Error('rate limit')]) {
  test(`failed generation is not retried: ${String(response)}`, async () => {
    let calls = 0;
    await assert.rejects(generateStagedDeliverable({
      stageNumber: 1, systemPromptBase: '', userMessageIntro: '',
      llmClient: { chat: async () => {
        calls++;
        if (response instanceof Error) throw response;
        return response;
      } },
    }));
    assert.equal(calls, 1);
  });
}
