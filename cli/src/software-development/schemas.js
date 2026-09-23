/**
 * Software-development-profile data contracts.
 *
 * Pure, dependency-free validation for the records that let a `software-development`
 * initiative reuse a trwały (durable) product context across multiple initiatives and
 * repositories, instead of every initiative rebuilding it from zero:
 *   Product          — one real product, identified independently of any initiative.
 *   RepositoryRef     — one repository belonging to a product (host, owner, name, role).
 *   Baseline          — an immutable, evidence-backed snapshot of a product at a set of
 *                        pinned repository commits (see profiles/software-development
 *                        Stage 1). A new analysis produces a NEW baseline id; an existing
 *                        baseline is never mutated in place.
 *   EvidenceEntry     — one citation (`EV-NNN`) tying a claim to a specific repository,
 *                        ref/commit and path/symbol.
 *   TaskRequest / TaskResult — the contract between an initiative stage and whichever
 *                        executor performs the work (the CLI/Web API-driven runner, or an
 *                        active host agent). Both executors must produce a TaskResult
 *                        shaped exactly this way so the rest of the pipeline does not
 *                        need to know which one ran.
 *
 * This file is byte-identical in cli/src/software-development/schemas.js and
 * babok-mcp/src/lib/software-development/schemas.js (enforced by
 * tests/unit/lib-parity.test.js), so it must not import anything package-specific.
 *
 * Validation here is intentionally hand-rolled (no JSON-Schema library dependency),
 * mirroring the style of cli/src/profiles.js's validateProfile(): throw a single,
 * specific Error on the first problem found rather than accumulating a report.
 */

const HOSTS = ['github', 'gitlab', 'other'];
const TASK_STATUSES = ['queued', 'running', 'awaiting_host', 'awaiting_human', 'blocked', 'failed', 'cancelled', 'completed'];
const TASK_EXECUTORS = ['api', 'host'];
const EVIDENCE_TYPES = ['fact', 'hypothesis', 'assumption'];

function requireString(obj, key, where) {
  if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
    throw new Error(`${where}: "${key}" must be a non-empty string`);
  }
}

function requireOneOf(obj, key, allowed, where) {
  if (!allowed.includes(obj[key])) {
    throw new Error(`${where}: "${key}" must be one of ${allowed.join(', ')}, got ${JSON.stringify(obj[key])}`);
  }
}

function requireArray(obj, key, where) {
  if (!Array.isArray(obj[key])) {
    throw new Error(`${where}: "${key}" must be an array`);
  }
}

/**
 * @param {{ id: string, host: string, owner: string, name: string, role?: string, default_ref?: string }} repo
 * @param {string} [where]
 */
export function validateRepositoryRef(repo, where = 'repository') {
  if (!repo || typeof repo !== 'object') throw new Error(`${where}: must be an object`);
  requireString(repo, 'id', where);
  requireOneOf(repo, 'host', HOSTS, where);
  requireString(repo, 'owner', where);
  requireString(repo, 'name', where);
  if (repo.role !== undefined) requireString(repo, 'role', where);
  if (repo.default_ref !== undefined) requireString(repo, 'default_ref', where);
}

/**
 * @param {{ product_id: string, name: string, created_at: string, repositories: object[] }} product
 */
export function validateProduct(product) {
  const where = `product ${product?.product_id ?? '?'}`;
  if (!product || typeof product !== 'object') throw new Error('product: must be an object');
  requireString(product, 'product_id', where);
  requireString(product, 'name', where);
  requireString(product, 'created_at', where);
  requireArray(product, 'repositories', where);
  const ids = new Set();
  for (const repo of product.repositories) {
    validateRepositoryRef(repo, `${where} repository`);
    if (ids.has(repo.id)) throw new Error(`${where}: duplicate repository id "${repo.id}"`);
    ids.add(repo.id);
  }
}

/**
 * @param {{ repository_id: string, ref: string, commit_sha: string|null, dirty: boolean, dirty_snapshot_id?: string|null }} entry
 */
export function validateRepositorySnapshot(entry, where = 'repository snapshot') {
  if (!entry || typeof entry !== 'object') throw new Error(`${where}: must be an object`);
  requireString(entry, 'repository_id', where);
  requireString(entry, 'ref', where);
  if (typeof entry.dirty !== 'boolean') throw new Error(`${where}: "dirty" must be a boolean`);
  if (entry.dirty) {
    if (typeof entry.dirty_snapshot_id !== 'string' || entry.dirty_snapshot_id.trim() === '') {
      throw new Error(`${where}: a dirty repository snapshot requires a non-empty "dirty_snapshot_id"`);
    }
  } else if (typeof entry.commit_sha !== 'string' || entry.commit_sha.trim() === '') {
    throw new Error(`${where}: a clean repository snapshot requires a non-empty "commit_sha"`);
  }
}

/**
 * @param {{ id: string, repository_id: string, ref: string, path?: string, symbol?: string, claim: string, type?: string, confidence?: string }} entry
 */
export function validateEvidenceEntry(entry, where = 'evidence entry') {
  if (!entry || typeof entry !== 'object') throw new Error(`${where}: must be an object`);
  requireString(entry, 'id', where);
  if (!/^EV-\d{3,}$/.test(entry.id)) throw new Error(`${where}: "id" must match EV-NNN, got ${JSON.stringify(entry.id)}`);
  requireString(entry, 'repository_id', where);
  requireString(entry, 'ref', where);
  requireString(entry, 'claim', where);
  if (entry.type !== undefined) requireOneOf(entry, 'type', EVIDENCE_TYPES, where);
}

/**
 * @param {{ baseline_id: string, product_id: string, created_at: string, repositories: object[], evidence: object[] }} baseline
 */
export function validateBaselineManifest(baseline) {
  const where = `baseline ${baseline?.baseline_id ?? '?'}`;
  if (!baseline || typeof baseline !== 'object') throw new Error('baseline: must be an object');
  requireString(baseline, 'baseline_id', where);
  requireString(baseline, 'product_id', where);
  requireString(baseline, 'created_at', where);
  requireArray(baseline, 'repositories', where);
  for (const snapshot of baseline.repositories) validateRepositorySnapshot(snapshot, `${where} repository snapshot`);
  if (baseline.evidence !== undefined) {
    requireArray(baseline, 'evidence', where);
    const ids = new Set();
    for (const entry of baseline.evidence) {
      validateEvidenceEntry(entry, `${where} evidence`);
      if (ids.has(entry.id)) throw new Error(`${where}: duplicate evidence id "${entry.id}"`);
      ids.add(entry.id);
    }
  }
}

/**
 * @param {{ task_id: string, initiative_id: string, stage: number, kind: string, inputs: object, constraints?: object, created_at: string }} task
 */
export function validateTaskRequest(task) {
  const where = `task ${task?.task_id ?? '?'}`;
  if (!task || typeof task !== 'object') throw new Error('task request: must be an object');
  requireString(task, 'task_id', where);
  requireString(task, 'initiative_id', where);
  if (!Number.isInteger(task.stage) || task.stage < 0) throw new Error(`${where}: "stage" must be a non-negative integer`);
  requireString(task, 'kind', where);
  if (typeof task.inputs !== 'object' || task.inputs === null) throw new Error(`${where}: "inputs" must be an object`);
  requireString(task, 'created_at', where);
}

/**
 * @param {{ task_id: string, status: string, executor: string, artefacts?: object, evidence?: object[], gaps?: object[], model?: string, completed_at?: string }} result
 */
export function validateTaskResult(result) {
  const where = `task result ${result?.task_id ?? '?'}`;
  if (!result || typeof result !== 'object') throw new Error('task result: must be an object');
  requireString(result, 'task_id', where);
  requireOneOf(result, 'status', TASK_STATUSES, where);
  requireOneOf(result, 'executor', TASK_EXECUTORS, where);
  if (result.evidence !== undefined) {
    requireArray(result, 'evidence', where);
    for (const entry of result.evidence) validateEvidenceEntry(entry, `${where} evidence`);
  }
}

export const KNOWN_HOSTS = HOSTS;
export const KNOWN_TASK_STATUSES = TASK_STATUSES;
export const KNOWN_TASK_EXECUTORS = TASK_EXECUTORS;
export const KNOWN_EVIDENCE_TYPES = EVIDENCE_TYPES;
