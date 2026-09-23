/**
 * Task runtime: task-store.js (lease/status persistence), api-executor.js
 * (baseline task fulfilled by this process), and host-task.js (the handoff a
 * host agent — such as this very Copilot CLI session — claims and fulfils).
 * The host-task round-trip test genuinely plays the host-agent role itself,
 * rather than mocking what a host agent would do.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  createTask,
  readTask,
  listRunIds,
  acquireLease,
  updateTaskStatus,
  completeTask,
} from '../../cli/src/software-development/runtime/task-store.js';
import { runBaselineTask } from '../../cli/src/software-development/runtime/api-executor.js';
import {
  createHostTask,
  listPendingHostTasks,
  claimHostTask,
  submitHostTaskResult,
} from '../../cli/src/software-development/runtime/host-task.js';
import { createProduct } from '../../cli/src/software-development/product-store.js';

let tmpBase;
let originalCwd;
const INITIATIVE = 'SD-20260101-TEST';

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-runtime-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase);
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

describe('task-store', () => {
  it('creates a queued task and reads it back', () => {
    const created = createTask(INITIATIVE, { stage: 1, kind: 'baseline', inputs: { x: 1 } }, { runId: 'run-basic' });
    assert.equal(created.status, 'queued');
    const reread = readTask(INITIATIVE, 'run-basic');
    assert.equal(reread.request.task_id, 'run-basic');
    assert.equal(reread.request.initiative_id, INITIATIVE);
    assert.ok(listRunIds(INITIATIVE).includes('run-basic'));
  });

  it('acquireLease transitions queued -> running and blocks a different worker', () => {
    createTask(INITIATIVE, { stage: 1, kind: 'baseline', inputs: {} }, { runId: 'run-lease' });
    const state = acquireLease(INITIATIVE, 'run-lease', 'worker-a');
    assert.equal(state.status, 'running');
    assert.equal(state.lease.workerId, 'worker-a');
    assert.throws(() => acquireLease(INITIATIVE, 'run-lease', 'worker-b'), /already leased by "worker-a"/);
    // The same worker re-claiming (e.g. after a crash/restart) is fine.
    assert.doesNotThrow(() => acquireLease(INITIATIVE, 'run-lease', 'worker-a'));
  });

  it('updateTaskStatus refuses a terminal target and refuses to change an already-terminal task', () => {
    createTask(INITIATIVE, { stage: 1, kind: 'baseline', inputs: {} }, { runId: 'run-status' });
    assert.throws(() => updateTaskStatus(INITIATIVE, 'run-status', 'completed'), /use completeTask/);
    updateTaskStatus(INITIATIVE, 'run-status', 'awaiting_human');
    completeTask(INITIATIVE, 'run-status', { status: 'cancelled', executor: 'api' });
    assert.throws(() => updateTaskStatus(INITIATIVE, 'run-status', 'blocked'), /already cancelled/);
  });

  it('completeTask releases the lease and refuses a second completion', () => {
    createTask(INITIATIVE, { stage: 1, kind: 'baseline', inputs: {} }, { runId: 'run-complete' });
    acquireLease(INITIATIVE, 'run-complete', 'worker-a');
    const state = completeTask(INITIATIVE, 'run-complete', { status: 'completed', executor: 'api', artefacts: { ok: true } });
    assert.equal(state.status, 'completed');
    assert.equal(state.lease, null);
    assert.equal(state.result.artefacts.ok, true);
    assert.throws(() => completeTask(INITIATIVE, 'run-complete', { status: 'completed', executor: 'api' }), /already completed/);
  });
});

function fakeConnector({ shouldFail = false } = {}) {
  return {
    async getRepository() { return { fullName: 'acme/widget', defaultBranch: 'main', private: false, htmlUrl: 'https://x', description: null }; },
    async resolveCommit() {
      if (shouldFail) throw new Error('simulated connector failure: repository unreachable');
      return { sha: 'b'.repeat(40), message: 'msg', author: 'a', date: '2026-01-01T00:00:00Z' };
    },
    async getTree() { return { truncated: false, entries: [{ path: 'package.json', type: 'blob' }] }; },
    async getFileContent() { return { path: 'package.json', sha: 'f1', size: 2, content: '{"name":"widget"}', truncatedForBudget: false }; },
  };
}

describe('api-executor: runBaselineTask', () => {
  it('completes successfully and records the baseline id as an artefact', async () => {
    createProduct({ name: 'Runtime Product', repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }] }, { productId: 'PROD-RUNTIMEOK' });
    const { runId, state, baseline } = await runBaselineTask(INITIATIVE, {
      stage: 1,
      productId: 'PROD-RUNTIMEOK',
      repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }],
      connectors: { github: fakeConnector() },
    });
    assert.equal(state.status, 'completed');
    assert.equal(state.result.executor, 'api');
    assert.equal(state.result.artefacts.baselineId, baseline.baseline_id);
    assert.ok(readTask(INITIATIVE, runId).result.evidence.length > 0);
  });

  it('records a failed TaskResult (not a thrown exception) when the connector fails', async () => {
    createProduct({ name: 'Runtime Fail Product', repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }] }, { productId: 'PROD-RUNTIMEFAIL' });
    const { state, baseline } = await runBaselineTask(INITIATIVE, {
      stage: 1,
      productId: 'PROD-RUNTIMEFAIL',
      repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }],
      connectors: { github: fakeConnector({ shouldFail: true }) },
    });
    assert.equal(state.status, 'failed');
    assert.equal(baseline, null);
    assert.match(state.result.gaps[0].reason, /simulated connector failure/);
  });
});

describe('host-task handoff (this session genuinely plays the host-agent role)', () => {
  it('round-trips a task from creation through host claim to a submitted result', () => {
    const { runId } = createHostTask(INITIATIVE, { stage: 3, kind: 'options', inputs: { changeGoal: 'Add saved payment methods' } });

    const pending = listPendingHostTasks(INITIATIVE);
    assert.ok(pending.some(p => p.runId === runId));

    // This is the host agent (this Copilot CLI session) claiming the task —
    // a real claim against the real lease mechanism, not a mock.
    const claimedRequest = claimHostTask(INITIATIVE, runId, 'copilot-cli');
    assert.equal(claimedRequest.kind, 'options');
    assert.equal(claimedRequest.inputs.changeGoal, 'Add saved payment methods');

    // ... the host agent would do real reasoning/tool-use here; this test
    // stands in a minimal, deterministic result for that step ...
    const finalState = submitHostTaskResult(INITIATIVE, runId, {
      status: 'completed',
      artefacts: { recommendedOption: 'OPT-01' },
      model: 'copilot-cli-host-agent',
    });

    assert.equal(finalState.status, 'completed');
    assert.equal(finalState.result.executor, 'host');
    assert.equal(finalState.result.artefacts.recommendedOption, 'OPT-01');
    assert.equal(listPendingHostTasks(INITIATIVE).some(p => p.runId === runId), false);
  });

  it('refuses a second host agent claiming an already-claimed task', () => {
    const { runId } = createHostTask(INITIATIVE, { stage: 3, kind: 'options', inputs: {} });
    claimHostTask(INITIATIVE, runId, 'copilot-cli');
    assert.throws(() => claimHostTask(INITIATIVE, runId, 'claude-code'), /already leased by "host:copilot-cli"/);
  });
});
