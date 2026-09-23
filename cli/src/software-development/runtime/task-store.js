/**
 * Task runtime store for the software-development profile: persists
 * TaskRequest/TaskResult records for one initiative under
 * projects/<initiative_id>/runs/<run_id>/state.json, with a lease so two
 * executors (the API-driven runner and an active host agent) cannot both
 * claim the same task.
 *
 * Status lifecycle (see cli/src/software-development/schemas.js
 * KNOWN_TASK_STATUSES): queued -> running -> (awaiting_host | awaiting_human |
 * blocked)* -> completed | failed | cancelled. Terminal statuses
 * (completed/failed/cancelled) are final — no further status transition or
 * lease acquisition is accepted once a task reaches one.
 *
 * This file is byte-identical in cli/src/software-development/runtime/task-store.js
 * and babok-mcp/src/lib/software-development/runtime/task-store.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getProjectDir } from '../../project.js';
import { validateTaskRequest, validateTaskResult } from '../schemas.js';

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);
const DEFAULT_LEASE_MS = 10 * 60 * 1000; // 10 minutes

/** @param {string} initiativeId @returns {string} */
export function getRunsDir(initiativeId) {
  return path.join(getProjectDir(initiativeId), 'runs');
}

/** @param {string} initiativeId @param {string} runId @returns {string} */
function getStateFilePath(initiativeId, runId) {
  return path.join(getRunsDir(initiativeId), runId, 'state.json');
}

function atomicWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

/** @returns {string} */
export function generateRunId() {
  return `run-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * @param {string} initiativeId
 * @param {{ stage: number, kind: string, inputs: object }} request - task_id/created_at are assigned here
 * @param {{ runId?: string }} [options]
 * @returns {object} the created task state record
 */
export function createTask(initiativeId, request, options = {}) {
  const runId = options.runId || generateRunId();
  const filePath = getStateFilePath(initiativeId, runId);
  if (fs.existsSync(filePath)) {
    throw new Error(`Task "${runId}" already exists for initiative "${initiativeId}"`);
  }
  const taskRequest = {
    task_id: runId,
    initiative_id: initiativeId,
    stage: request.stage,
    kind: request.kind,
    inputs: request.inputs ?? {},
    created_at: new Date().toISOString(),
  };
  validateTaskRequest(taskRequest);

  const state = {
    request: taskRequest,
    status: 'queued',
    lease: null,
    result: null,
    history: [{ at: taskRequest.created_at, status: 'queued' }],
  };
  atomicWriteJson(filePath, state);
  return state;
}

/**
 * @param {string} initiativeId
 * @param {string} runId
 * @returns {object}
 */
export function readTask(initiativeId, runId) {
  const filePath = getStateFilePath(initiativeId, runId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Task not found: ${runId} (initiative ${initiativeId})`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * @param {string} initiativeId
 * @returns {string[]} run ids, oldest first
 */
export function listRunIds(initiativeId) {
  const dir = getRunsDir(initiativeId);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'state.json')))
    .map(e => e.name)
    .sort();
}

/**
 * Claim a task for a given worker, refusing if another worker already holds an
 * unexpired lease. Re-claiming with the same workerId (e.g. after a crash and
 * restart of the same process identity) is allowed and refreshes the lease.
 * A freshly-claimed queued/awaiting_* task moves to "running".
 * @param {string} initiativeId
 * @param {string} runId
 * @param {string} workerId
 * @param {{ leaseMs?: number }} [options]
 * @returns {object} the updated task state
 */
export function acquireLease(initiativeId, runId, workerId, options = {}) {
  const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;
  const state = readTask(initiativeId, runId);
  if (TERMINAL_STATUSES.has(state.status)) {
    throw new Error(`Task "${runId}" is already ${state.status} — cannot acquire a lease on a terminal task`);
  }
  const now = Date.now();
  if (state.lease && state.lease.workerId !== workerId && new Date(state.lease.expiresAt).getTime() > now) {
    throw new Error(`Task "${runId}" is already leased by "${state.lease.workerId}" until ${state.lease.expiresAt}`);
  }
  state.lease = { workerId, acquiredAt: new Date(now).toISOString(), expiresAt: new Date(now + leaseMs).toISOString() };
  if (['queued', 'awaiting_host', 'awaiting_human', 'blocked'].includes(state.status)) {
    state.status = 'running';
    state.history.push({ at: new Date(now).toISOString(), status: 'running', workerId });
  }
  atomicWriteJson(getStateFilePath(initiativeId, runId), state);
  return state;
}

/**
 * Move a non-terminal task to a new non-terminal status (e.g. "awaiting_host",
 * "awaiting_human", "blocked"). Use completeTask() for a terminal status so the
 * TaskResult is validated consistently.
 * @param {string} initiativeId
 * @param {string} runId
 * @param {'queued'|'running'|'awaiting_host'|'awaiting_human'|'blocked'} status
 * @param {object} [extra] - merged into the state record (e.g. { note })
 * @returns {object} the updated task state
 */
export function updateTaskStatus(initiativeId, runId, status, extra = {}) {
  if (TERMINAL_STATUSES.has(status)) {
    throw new Error(`updateTaskStatus: use completeTask() to set a terminal status ("${status}")`);
  }
  const state = readTask(initiativeId, runId);
  if (TERMINAL_STATUSES.has(state.status)) {
    throw new Error(`Task "${runId}" is already ${state.status} — cannot change a terminal task's status`);
  }
  state.status = status;
  Object.assign(state, extra);
  state.history.push({ at: new Date().toISOString(), status });
  atomicWriteJson(getStateFilePath(initiativeId, runId), state);
  return state;
}

/**
 * Record a terminal TaskResult (completed/failed/cancelled) and release the lease.
 * @param {string} initiativeId
 * @param {string} runId
 * @param {{ status: 'completed'|'failed'|'cancelled', executor: 'api'|'host', artefacts?: object, evidence?: object[], gaps?: object[], model?: string }} result
 * @returns {object} the updated task state
 */
export function completeTask(initiativeId, runId, result) {
  const state = readTask(initiativeId, runId);
  if (TERMINAL_STATUSES.has(state.status)) {
    throw new Error(`Task "${runId}" is already ${state.status}`);
  }
  const taskResult = { ...result, task_id: runId, completed_at: new Date().toISOString() };
  validateTaskResult(taskResult);
  if (!TERMINAL_STATUSES.has(taskResult.status)) {
    throw new Error(`completeTask: result.status "${taskResult.status}" is not terminal (completed/failed/cancelled)`);
  }
  state.status = taskResult.status;
  state.result = taskResult;
  state.lease = null;
  state.history.push({ at: taskResult.completed_at, status: taskResult.status, executor: taskResult.executor });
  atomicWriteJson(getStateFilePath(initiativeId, runId), state);
  return state;
}
