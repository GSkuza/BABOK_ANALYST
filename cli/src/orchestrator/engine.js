import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { runParallel } from './parallel-runner.js';
import { readContext, mergeStageOutput } from './context-manager.js';
import { executeStage } from './stage-executor.js';
import { runQualityLoop } from './quality-loop.js';
import { getProjectDir } from '../project.js';
import { getProjectProfile, readJournal, writeJournal } from '../journal.js';
import { DEFAULT_PROFILE_ID, getStageFileNames, loadProfile, resolveProfilePath } from '../profiles.js';
import { createMessageBus } from './message-bus.js';

const activeStageWorkers = new Set();

export function cancelStageWorkers() {
  const workers = [...activeStageWorkers];
  activeStageWorkers.clear();
  for (const worker of workers) {
    try {
      worker.terminate();
    } catch {
      // ignore
    }
  }
  return workers.length;
}

function runStageInWorker(payload) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./stage-worker.js', import.meta.url), { workerData: payload });
    activeStageWorkers.add(worker);
    let settled = false;
    const cleanup = () => activeStageWorkers.delete(worker);
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };
    worker.once('message', (message) => {
      if (message?.ok) finish(resolve, message.result);
      else finish(reject, new Error(message?.error || 'Stage worker failed.'));
    });
    worker.once('error', (error) => {
      finish(reject, error);
    });
    worker.once('exit', (code) => {
      if (code !== 0) finish(reject, new Error(`Stage worker exited with code ${code}.`));
    });
  });
}

/**
 * Persist a full-stage deliverable's journal bookkeeping (status, deliverable
 * file, next-stage unlock) the same way cli/src/commands/run.js's
 * updateJournalStage does for its own (non-orchestrated) path — kept as a
 * small local twin rather than a shared import because run.js supports an
 * arbitrary --output directory while this path always uses the canonical
 * projects/<id>/ directory via readJournal/writeJournal.
 */
function recordFullStageDeliverable(projectId, stageNumber, fileName, extra = {}) {
  const journal = readJournal(projectId);
  const now = new Date().toISOString();
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (stage) {
    stage.status = 'approved';
    stage.completed_at = now;
    stage.approved_at = now;
    stage.approved_by = 'auto-run';
    stage.deliverable_file = fileName;
    Object.assign(stage, extra);
  }
  const nextStage = journal.stages.find(s => s.stage === stageNumber + 1);
  if (nextStage && nextStage.status === 'not_started') {
    nextStage.status = 'in_progress';
    nextStage.started_at = now;
    journal.current_stage = stageNumber + 1;
  }
  journal.last_updated = now;
  writeJournal(projectId, journal);
}

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
    llmRuntime,
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
  const canUseWorkerIsolation = !dryRun && !!llmRuntime && !providedClient && !providedDeepClient;

  // Best-effort — a journal may not exist yet (e.g. dryRun tests against a
  // scratch projectId), in which case English is a safe default.
  let language = 'EN';
  try {
    language = readJournal(projectId).language || 'EN';
  } catch {
    // no journal — default stands
  }

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
    const clientForStage = canUseWorkerIsolation ? null : (taskRouter?.getStageClient
      ? taskRouter.getStageClient(stageNumber)
      : (isDeepStage ? deepAnalysisClient : llmClient));

    emit({ type: 'stage_started', stage: stageKey, mode: isDeepStage ? 'deep_analysis' : 'standard' });

    try {
      const stageResult = canUseWorkerIsolation
        ? await runStageInWorker({
          stageKey,
          stageConfig,
          context,
          projectId,
          profile,
          stageNumber,
          language,
          llmRuntime,
        })
        : await (async () => {
          const execResult = await executeStage(
            stageKey, stageConfig, context, clientForStage, {
              dryRun,
              projectId,
              profile,
              stageNumber,
              language,
              onProgress: event => emit({ type: 'stage_progress', ...event }),
            }
          );

          const qualityResult = await runQualityLoop(
            projectId, stageNumber, execResult.artefact, clientForStage, {
              dryRun,
              profile,
              taskRouter,
              localOnly: true,
              maxIterations: 1,
              onIteration: (e) => emit({
                type: e.escalated ? 'quality_escalate' : 'quality_iteration',
                ...e,
              }),
            }
          );
          return { execResult, qualityResult };
        })();
      const { execResult, qualityResult } = stageResult;

      await mergeStageOutput(projectId, stageKey, qualityResult.finalArtefact);
      // Refresh context so later stages see the new output
      context = readContext(projectId);

      artefacts[stageKey] = qualityResult.finalArtefact;
      stagesCompleted.push(stageKey);

      // Bridge to the canonical STAGE_NN_*.md deliverable + journal so a full
      // stage deliverable produced by --orchestrate can actually be approved
      // via `babok approve` (previously only artifacts/<stageKey>/artefact.md
      // was written, which the Two-Key gate never looks at).
      if (execResult.isFullStageDeliverable && !dryRun) {
        const fileName = getStageFileNames(profile)[stageNumber];
        fs.writeFileSync(path.join(getProjectDir(projectId), fileName), qualityResult.finalArtefact, 'utf-8');
        recordFullStageDeliverable(projectId, stageNumber, fileName, {
          generation_batches_used: execResult.generation?.batches ?? null,
          final_pass_mode: execResult.generation?.finalPass?.mode ?? null,
        });
      }

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
