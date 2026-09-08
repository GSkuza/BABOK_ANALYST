import fs from 'fs';
import path from 'path';
import { getProjectDir } from '../project.js';
import { loadRubric } from '../templates.js';
import { buildStageSystemPromptBase } from '../generation/prompt-builder.js';
import { generateStagedDeliverable } from '../generation/staged-generator.js';

/**
 * @param {string} stageKey - e.g. 'stage1', 'stage2', 'stage7_initial_risk_scan'
 * @param {object} stageConfig - parsed stage config JSON (currently informational only)
 * @param {object} context - current pipeline context
 * @param {object} llmClient - { chat(systemPrompt, userMessage): Promise<string> }
 * @param {{ dryRun?: boolean, projectId?: string, profile?: object, stageNumber?: number, language?: string }} options
 * @returns {Promise<{
 *   key: string, artefact: string, durationMs: number, dryRun: boolean,
 *   isFullStageDeliverable: boolean, generation: object|null,
 * }>}
 */
export async function executeStage(stageKey, stageConfig, context, llmClient, options = {}) {
  const { dryRun = false, projectId, profile, stageNumber, language = 'EN', onProgress } = options;

  if (dryRun) {
    return {
      key: stageKey,
      artefact: '[DRY RUN] Stage ' + stageKey + ' placeholder artefact',
      durationMs: 0,
      dryRun: true,
      isFullStageDeliverable: false,
      generation: null,
    };
  }

  // A "full stage deliverable" task is one whose key names the stage exactly
  // (e.g. 'stage4'). Compound keys like 'stage7_initial_risk_scan' are
  // auxiliary/preliminary tasks feeding later stages as context — they have
  // no rubric entry shaped for the full deliverable, so they get a single
  // generation pass against the real stage prompt rather than the full
  // batched pipeline.
  const isFullStageDeliverable = profile != null && stageNumber != null && stageKey === `stage${stageNumber}`;

  const systemPromptBase = buildStageSystemPromptBase(profile, stageNumber, context, language);
  const stageMeta = profile?.stages?.find(s => s.stage === stageNumber);
  const stageLabel = stageMeta?.name || stageKey;

  const userMessageIntro = language === 'PL'
    ? `Wygeneruj kompletny dokument dostarczany dla Etapu ${stageNumber}: "${stageLabel}". ` +
      `Użyj dostarczonego kontekstu i wygeneruj profesjonalny, kompleksowy dokument analizy biznesowej zgodny ze standardem BABOK v3.`
    : `Generate the complete deliverable document for Stage ${stageNumber}: "${stageLabel}". ` +
      `Use the provided context and generate a professional, comprehensive business analysis document following BABOK v3 standards.`;

  const startMs = Date.now();
  let artefact;
  let generation = null;

  if (isFullStageDeliverable) {
    const rubric = loadRubric(profile);
    const stageRubric = rubric.stages[`stage${stageNumber}`];
    const isDeepStage = profile.orchestrator.deep_analysis_stages.includes(stageNumber);

    generation = await generateStagedDeliverable({
      stageNumber,
      profile,
      llmClient,
      systemPromptBase,
      userMessageIntro,
      context,
      rubric,
      stageRubric,
      batchGroups: stageRubric?.generation_batches,
      isDeepStage,
      projectDir: projectId ? getProjectDir(projectId) : undefined,
      options: {
        model: llmClient.modelName,
        classifyVerdict: llmClient.classifyVerdict,
        onProgress: event => onProgress?.({ stage: stageKey, ...event }),
      },
    });
    artefact = generation.finalDocument;
  } else {
    artefact = await llmClient.chat(systemPromptBase, userMessageIntro);
  }

  const durationMs = Date.now() - startMs;

  if (projectId) {
    const artefactDir = path.join(getProjectDir(projectId), 'artifacts', stageKey);
    fs.mkdirSync(artefactDir, { recursive: true });
    fs.writeFileSync(path.join(artefactDir, 'artefact.md'), artefact, 'utf-8');
  }

  return { key: stageKey, artefact, durationMs, dryRun: false, isFullStageDeliverable, generation };
}
