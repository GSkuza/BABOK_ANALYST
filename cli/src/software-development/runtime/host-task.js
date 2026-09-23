/**
 * Host-agent task handoff for the software-development profile: creates a
 * task in "awaiting_host" status that an active plugin host (Copilot CLI,
 * Claude Code, Codex) picks up via its own tools/reasoning and reports back
 * through submitHostTaskResult — the MCP-exposed counterpart of
 * api-executor.js's runBaselineTask(), sharing the same TaskRequest/TaskResult
 * contract so the rest of the pipeline never needs to know which executor ran.
 *
 * This module does not itself run any agent — it only manages the handoff
 * state. A host with no available agent leaves the task in "awaiting_host"
 * indefinitely; that is a correct, honest outcome, not a failure to paper over.
 *
 * This file is byte-identical in cli/src/software-development/runtime/host-task.js
 * and babok-mcp/src/lib/software-development/runtime/host-task.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import { createTask, readTask, listRunIds, acquireLease, completeTask, updateTaskStatus } from './task-store.js';

/**
 * Create a task for a host agent to fulfil and immediately mark it
 * "awaiting_host" (no executor has claimed it yet).
 * @param {string} initiativeId
 * @param {{ stage: number, kind: string, inputs: object }} request
 * @returns {{ runId: string, state: object }}
 */
export function createHostTask(initiativeId, request) {
  const created = createTask(initiativeId, request);
  const runId = created.request.task_id;
  const state = updateTaskStatus(initiativeId, runId, 'awaiting_host');
  return { runId, state };
}

/**
 * List every task in this initiative still awaiting a host agent — what an
 * MCP tool like `sd_list_pending_host_tasks` exposes to the active agent.
 * @param {string} initiativeId
 * @returns {Array<{ runId: string, request: object }>}
 */
export function listPendingHostTasks(initiativeId) {
  return listRunIds(initiativeId)
    .map(runId => ({ runId, state: readTask(initiativeId, runId) }))
    .filter(({ state }) => state.status === 'awaiting_host')
    .map(({ runId, state }) => ({ runId, request: state.request }));
}

/**
 * A host agent claims a pending task before starting work on it.
 * @param {string} initiativeId
 * @param {string} runId
 * @param {string} hostAgentId - e.g. "copilot-cli", "claude-code", "codex"
 * @returns {object} the claimed task's request
 */
export function claimHostTask(initiativeId, runId, hostAgentId) {
  const state = acquireLease(initiativeId, runId, `host:${hostAgentId}`);
  if (state.status !== 'running') {
    throw new Error(`Task "${runId}" is "${state.status}", not claimable (expected it to be awaiting_host)`);
  }
  return state.request;
}

/**
 * A host agent reports its result. Mirrors api-executor.js's completeTask
 * call — same contract, different executor value.
 * @param {string} initiativeId
 * @param {string} runId
 * @param {{ status: 'completed'|'failed'|'cancelled', artefacts?: object, evidence?: object[], gaps?: object[], model?: string }} result
 * @returns {object} the updated task state
 */
export function submitHostTaskResult(initiativeId, runId, result) {
  return completeTask(initiativeId, runId, { ...result, executor: 'host' });
}
