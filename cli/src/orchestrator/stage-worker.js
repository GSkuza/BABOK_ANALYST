import { parentPort, workerData, isMainThread } from 'worker_threads';
import { executeStage } from './stage-executor.js';
import { runQualityLoop } from './quality-loop.js';
import { createTaskRouter } from '../router.js';

/**
 * Optional worker entrypoint for stage execution isolation.
 * This file is intentionally minimal and can be enabled incrementally.
 */
export async function runStageWorker(payload) {
  const {
    stageKey,
    stageConfig,
    context,
    projectId,
    profile,
    stageNumber,
    language,
    llmRuntime,
  } = payload;
  const taskRouter = createTaskRouter(llmRuntime);
  const clientForStage = taskRouter.getStageClient(stageNumber);
  const execResult = await executeStage(
    stageKey,
    stageConfig,
    context,
    clientForStage,
    { dryRun: false, projectId, profile, stageNumber, language },
  );
  const qualityResult = await runQualityLoop(projectId, stageNumber, execResult.artefact, clientForStage, {
    dryRun: false,
    profile,
    taskRouter,
    localOnly: true,
    maxIterations: 1,
  });
  return { execResult, qualityResult };
}

if (!isMainThread && parentPort) {
  runStageWorker(workerData)
    .then((result) => parentPort.postMessage({ ok: true, result }))
    .catch((error) => parentPort.postMessage({ ok: false, error: error?.message || String(error) }));
}
