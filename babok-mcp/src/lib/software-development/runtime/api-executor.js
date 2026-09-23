/**
 * API-driven task executor for the software-development profile: fulfils a
 * task using this process's own LLM client (or, for the "baseline" kind,
 * mechanical evidence-gathering that needs no LLM at all — see
 * baseline-builder.js) rather than handing it off to an active host agent.
 *
 * This is one of the two executors the plan requires behind one TaskRequest/
 * TaskResult contract (cli/src/software-development/schemas.js); the other is
 * the host-agent handoff in ./host-task.js. Callers pick an executor per task,
 * not per initiative — a profile may use either or both across its lifetime.
 *
 * This file is byte-identical in cli/src/software-development/runtime/api-executor.js
 * and babok-mcp/src/lib/software-development/runtime/api-executor.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import { createTask, acquireLease, completeTask } from './task-store.js';
import { buildBaseline } from '../baseline-builder.js';

const API_WORKER_ID = 'api-executor';

/**
 * Run Stage 1's autonomous baseline build as an API-executor task: creates the
 * task record, claims it, calls buildBaseline(), and records a terminal
 * TaskResult either way — a thrown error becomes a "failed" result with the
 * error message, never a silently swallowed exception.
 *
 * @param {string} initiativeId
 * @param {{
 *   stage: number, productId: string,
 *   repositories: Array<{ id: string, host: string, owner: string, name: string, ref?: string }>,
 *   connectors: object, llmClient?: object,
 * }} input
 * @returns {Promise<{ runId: string, state: object, baseline: object|null }>}
 */
export async function runBaselineTask(initiativeId, input) {
  const { stage, productId, repositories, connectors, llmClient } = input;
  const created = createTask(initiativeId, {
    stage,
    kind: 'baseline',
    inputs: { productId, repositoryIds: repositories.map(r => r.id) },
  });
  const runId = created.request.task_id;
  acquireLease(initiativeId, runId, API_WORKER_ID);

  try {
    const result = await buildBaseline({ productId, repositories, connectors, llmClient });
    const state = completeTask(initiativeId, runId, {
      status: 'completed',
      executor: 'api',
      artefacts: { baselineId: result.baseline.baseline_id, productId },
      evidence: result.baseline.evidence,
      model: llmClient?.modelName,
    });
    return { runId, state, baseline: result.baseline };
  } catch (err) {
    const state = completeTask(initiativeId, runId, {
      status: 'failed',
      executor: 'api',
      gaps: [{ reason: err.message }],
    });
    return { runId, state, baseline: null };
  }
}
