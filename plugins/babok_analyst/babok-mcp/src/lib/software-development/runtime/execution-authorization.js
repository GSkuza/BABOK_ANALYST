/**
 * Execution-authorisation record for the software-development profile.
 *
 * Approving a stage deliverable (including Stage 4's Implementation &
 * Verification Plan) is never, by itself, authorisation to run the analysed
 * repository's own code/tests or to publish a branch/PR/MR — the profile's
 * system prompt and Stage 4 template require that as a distinct, explicit
 * decision (see profiles/software-development/stages/SoftwareDevelopment_agent_stage_4.md,
 * Step 4.3). This module is where that decision is durably recorded and
 * checked, per initiative and per scope, so code-executor.js (and any future
 * publish-side action) has something concrete to enforce against rather than
 * trusting a prompt instruction alone.
 *
 * This file is byte-identical in
 * cli/src/software-development/runtime/execution-authorization.js and
 * babok-mcp/src/lib/software-development/runtime/execution-authorization.js
 * (enforced by tests/unit/lib-parity.test.js).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getProjectDir } from '../../project.js';

const KNOWN_SCOPES = ['run_tests', 'publish_branch'];

function getFilePath(initiativeId) {
  return path.join(getProjectDir(initiativeId), 'execution_authorization.json');
}

function atomicWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

function readAll(initiativeId) {
  const filePath = getFilePath(initiativeId);
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Record (or revoke) an explicit, human-made authorisation for one scope of
 * one initiative. Grants are never inferred from stage approval — a caller
 * must call this with an actual human decision.
 * @param {string} initiativeId
 * @param {'run_tests'|'publish_branch'} scope
 * @param {{ granted: boolean, grantedBy: string, constraints?: { allowedCommands?: string[], allowedDirectories?: string[], networkAccess?: boolean } }} grant
 * @returns {object} the full authorization record for this initiative
 */
export function setExecutionAuthorization(initiativeId, scope, grant) {
  if (!KNOWN_SCOPES.includes(scope)) {
    throw new Error(`setExecutionAuthorization: unknown scope "${scope}" (expected one of ${KNOWN_SCOPES.join(', ')})`);
  }
  if (typeof grant.grantedBy !== 'string' || grant.grantedBy.trim() === '') {
    throw new Error('setExecutionAuthorization: "grantedBy" (the human authorising this) is required');
  }
  const all = readAll(initiativeId);
  all[scope] = {
    granted: Boolean(grant.granted),
    grantedBy: grant.grantedBy,
    grantedAt: new Date().toISOString(),
    constraints: grant.constraints ?? {},
  };
  atomicWriteJson(getFilePath(initiativeId), all);
  return all;
}

/**
 * @param {string} initiativeId
 * @param {'run_tests'|'publish_branch'} scope
 * @returns {{ granted: boolean, grantedBy: string, grantedAt: string, constraints: object }|null}
 */
export function readExecutionAuthorization(initiativeId, scope) {
  return readAll(initiativeId)[scope] ?? null;
}

/**
 * @param {string} initiativeId
 * @param {'run_tests'|'publish_branch'} scope
 * @throws if the scope was never explicitly granted (or was explicitly revoked)
 * @returns {{ granted: true, grantedBy: string, grantedAt: string, constraints: object }}
 */
export function assertAuthorized(initiativeId, scope) {
  const record = readExecutionAuthorization(initiativeId, scope);
  if (!record || !record.granted) {
    throw new Error(
      `Execution scope "${scope}" is not authorised for initiative "${initiativeId}". `
      + 'Stage approval alone never grants this — record an explicit setExecutionAuthorization() decision first.',
    );
  }
  return record;
}
