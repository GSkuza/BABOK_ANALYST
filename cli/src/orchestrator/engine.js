import fs from 'fs';
import path from 'path';
import { runParallel } from './parallel-runner.js';
import { readContext, mergeStageOutput } from './context-manager.js';
import { executeStage } from './stage-executor.js';
import { runQualityLoop } from './quality-loop.js';
import { getProjectDir } from '../project.js';
import { getProjectProfile } from '../journal.js';
import { DEFAULT_PROFILE_ID, loadProfile, resolveProfilePath } from '../profiles.js';
import { createMessageBus } from './message-bus.js';

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

/** Profile: explicit option → project journal → default. */
function resolveProfile(projectId, options) {
  if (options.profile) {
    return typeof options.profile === 'string' ? loadProfile(options.profile) : options.profile;
  }
  try {
    return getProjectProfile(projectId);
  } catch {
    return loadProfile(DEFAULT_PROFILE_ID);
  }
}

/**
 * @param {string} projectId
 * @param {{ maxParallel?: number, dryRun?: boolean, stopAfterStage?: number, onProgress?: Function, llmClient?: object, deepAnalysisClient?: object, taskRouter?: object, profile?: string|object }} options
 * @returns {Promise<{ projectId: string, stagesCompleted: string[], stagesFailed: string[], totalDurationMs: number, artefacts: Object }>}
 */
export async function runPipeline(projectId, options = {}) {
  const {
    dryRun = false,
    stopAfterStage,
    onProgress,
    llmClient: providedClient,
    deepAnalysisClient: providedDeepClient,
    taskRouter,
  } = options;

  const profile = resolveProfile(projectId, options);
  const agentsDir = resolveProfilePath(profile, 'agents_dir');
  const deepAnalysisStages = new Set(profile.orchestrator.deep_analysis_stages);

  // Load orchestrator config (informational — pipeline shape comes from the profile)
  const _orchConfig = loadJsonConfig(path.join(agentsDir, 'orchestrator_config.json'));

  // Load per-stage configs for every stage referenced by the pipeline
  const stageConfigs = {};
  for (const group of profile.orchestrator.pipeline) {
    for (const key of group.stages) {
      const n = stageNumberFromKey(key);
      stageConfigs[`stage${n}`] ??= loadJsonConfig(path.join(agentsDir, `stage${n}_config.json`));
    }
  }

  // Noop client when none provided
  const llmClient = providedClient ?? { chat: async () => '[Mock response]' };
  // Falls back to llmClient when no separate deep-analysis client is configured
  const deepAnalysisClient = providedDeepClient ?? llmClient;
  const messageBus = createMessageBus(projectId);

  const emit = (event) => {
    onProgress?.(event);
    messageBus.publish(event.type, event);
  };

  const startTime = Date.now();
  const stagesCompleted = [];
  const stagesFailed = [];
  const artefacts = {};

  let context = readContext(projectId);

  // ── Stage runner helper ──────────────────────────────────────────────────
  const runStage = async (stageKey) => {
    const stageNumber = stageNumberFromKey(stageKey);
    const stageConfig = stageConfigs[`stage${stageNumber}`] ?? {};
    const isDeepStage = deepAnalysisStages.has(stageNumber);
    const clientForStage = taskRouter?.getStageClient
      ? taskRouter.getStageClient(stageNumber)
      : (isDeepStage ? deepAnalysisClient : llmClient);

    emit({ type: 'stage_started', stage: stageKey, mode: isDeepStage ? 'deep_analysis' : 'standard' });

    try {
      const execResult = await executeStage(
        stageKey, stageConfig, context, clientForStage, { dryRun, projectId }
      );

      const qualityResult = await runQualityLoop(
        projectId, stageNumber, execResult.artefact, clientForStage, {
          dryRun,
          profile,
          taskRouter,
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

  // ── Pipeline execution (shape declared in profile.orchestrator.pipeline) ──

  const finish = () => {
    const totalDurationMs = Date.now() - startTime;
    emit({ type: 'pipeline_complete', stagesCompleted, totalDurationMs });
    return { projectId, stagesCompleted, stagesFailed, totalDurationMs, artefacts };
  };

  // Stages numbered above stopAfterStage are skipped wherever they appear in the pipeline.
  const pastStop = (key) => stopAfterStage !== undefined && stageNumberFromKey(key) > stopAfterStage;

  for (const group of profile.orchestrator.pipeline) {
    const keys = group.stages.filter(key => !pastStop(key));
    if (keys.length === 0) continue;

    if (group.type === 'parallel') {
      // Errors in parallel stages are captured by runParallel — pipeline continues
      await runParallel(keys.map(key => ({ key, fn: () => runStage(key) })));
    } else {
      for (const key of keys) {
        await runStage(key);
      }
    }
  }

  return finish();
}
