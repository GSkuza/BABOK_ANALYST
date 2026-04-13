import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runParallel } from './parallel-runner.js';
import { readContext, mergeStageOutput } from './context-manager.js';
import { executeStage } from './stage-executor.js';
import { runQualityLoop } from './quality-loop.js';
import { getProjectDir } from '../project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// cli/src/orchestrator → ../../../ = BABOK_ANALYST/
const AGENTS_DIR = path.join(__dirname, '..', '..', '..', 'BABOK_AGENT', 'agents');

function loadJsonConfig(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

/** Extract stage number from a stageKey string (e.g. 'stage7_initial_risk_scan' → 7). */
function stageNumberFromKey(key) {
  const match = key.match(/^stage(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * @param {string} projectId
 * @param {{ maxParallel?: number, dryRun?: boolean, stopAfterStage?: number, onProgress?: Function, llmClient?: object }} options
 * @returns {Promise<{ projectId: string, stagesCompleted: string[], stagesFailed: string[], totalDurationMs: number, artefacts: Object }>}
 */
export async function runPipeline(projectId, options = {}) {
  const {
    dryRun = false,
    stopAfterStage,
    onProgress,
    llmClient: providedClient,
  } = options;

  // Load orchestrator config (informational — pipeline shape is defined below)
  const _orchConfig = loadJsonConfig(path.join(AGENTS_DIR, 'orchestrator_config.json'));

  // Load per-stage configs for stage1..stage8
  const stageConfigs = {};
  for (let n = 1; n <= 8; n++) {
    stageConfigs[`stage${n}`] = loadJsonConfig(path.join(AGENTS_DIR, `stage${n}_config.json`));
  }

  // Noop client when none provided
  const llmClient = providedClient ?? { chat: async () => '[Mock response]' };

  const emit = (event) => onProgress?.(event);

  const startTime = Date.now();
  const stagesCompleted = [];
  const stagesFailed = [];
  const artefacts = {};

  let context = readContext(projectId);

  // ── Stage runner helper ──────────────────────────────────────────────────
  const runStage = async (stageKey) => {
    const stageNumber = stageNumberFromKey(stageKey);
    const stageConfig = stageConfigs[`stage${stageNumber}`] ?? {};

    emit({ type: 'stage_started', stage: stageKey });

    try {
      const execResult = await executeStage(
        stageKey, stageConfig, context, llmClient, { dryRun, projectId }
      );

      const qualityResult = await runQualityLoop(
        projectId, stageNumber, execResult.artefact, llmClient, {
          dryRun,
          onIteration: (e) => emit({
            type: e.escalated ? 'quality_escalate' : 'quality_iteration',
            ...e,
          }),
        }
      );

      await mergeStageOutput(projectId, stageKey, qualityResult.finalArtefact);
      // Refresh context so later stages see the new output
      context = readContext(projectId);

      artefacts[stageKey] = qualityResult.finalArtefact;
      stagesCompleted.push(stageKey);

      emit({ type: 'stage_completed', stage: stageKey });
      return qualityResult.finalArtefact;
    } catch (err) {
      stagesFailed.push(stageKey);
      emit({ type: 'stage_failed', stage: stageKey, error: err.message });
      throw err;
    }
  };

  // ── Pipeline execution ───────────────────────────────────────────────────

  // 1. Stage 1 (mandatory first, sequential)
  await runStage('stage1');
  if (stopAfterStage === 1) {
    const totalDurationMs = Date.now() - startTime;
    emit({ type: 'pipeline_complete', stagesCompleted, totalDurationMs });
    return { projectId, stagesCompleted, stagesFailed, totalDurationMs, artefacts };
  }

  // 2. Parallel group: stage2 + stage7_initial_risk_scan
  const parallelResult = await runParallel([
    { key: 'stage2', fn: () => runStage('stage2') },
    { key: 'stage7_initial_risk_scan', fn: () => runStage('stage7_initial_risk_scan') },
  ]);
  // Errors in parallel stages are captured in parallelResult.errors — pipeline continues

  // 3. Remaining stages in sequence
  const sequentialStages = [
    { key: 'stage3', num: 3 },
    { key: 'stage4', num: 4 },
    { key: 'stage5', num: 5 },
    { key: 'stage6', num: 6 },
    { key: 'stage8', num: 8 },
  ];

  for (const { key, num } of sequentialStages) {
    if (stopAfterStage !== undefined && num > stopAfterStage) break;
    await runStage(key);
  }

  const totalDurationMs = Date.now() - startTime;
  emit({ type: 'pipeline_complete', stagesCompleted, totalDurationMs });

  return { projectId, stagesCompleted, stagesFailed, totalDurationMs, artefacts };
}
