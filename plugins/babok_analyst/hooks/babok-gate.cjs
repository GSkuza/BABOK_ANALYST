#!/usr/bin/env node
/**
 * PreToolUse/preToolUse hook — Two-Key Journal hard gate for agent tool calls.
 *
 * Blocks:
 * - babok_approve_stage (human must use `babok approve` CLI)
 * - babok_save_deliverable on approved stages without revision_open
 * - babok_save_deliverable while a human holds `.stage_N.lock` via `babok chat`/`babok run`
 *
 * Wired for Claude Code, Codex, and Copilot CLI, which use different block
 * contracts:
 * - Claude Code / Codex: exit code 2 blocks the tool; stderr is shown to the agent.
 * - Copilot CLI: exit code 2 does NOT block. Blocking requires stdout JSON
 *   { permissionDecision: "deny", permissionDecisionReason }. A crash or any
 *   other non-zero exit fail-closes (denies) there, so every path below must
 *   end in an explicit process.exit(0) or the deny helper — never throw.
 */

const fs = require('fs');
const path = require('path');
const { getProjectsDir, resolveProjectId } = require('./babok-config.cjs');
const { isCopilot } = require('./babok-runtime.cjs');

/**
 * Deny the pending tool call using the calling host's block contract, then exit.
 * @param {string} reason
 * @returns {never}
 */
function deny(reason) {
  process.stderr.write(`Two-Key Gate: ${reason}`);
  if (isCopilot) {
    process.stdout.write(JSON.stringify({ permissionDecision: 'deny', permissionDecisionReason: reason }));
    process.exit(0);
  }
  process.exit(2);
}

const STALE_MINUTES = 120; // matches cli/src/lock.js

/**
 * @param {string} projectId
 * @returns {object|null}
 */
function readJournal(projectId) {
  const journalPath = path.join(getProjectsDir(), projectId, `PROJECT_JOURNAL_${projectId}.json`);
  if (!fs.existsSync(journalPath)) return null;
  return JSON.parse(fs.readFileSync(journalPath, 'utf8'));
}

/**
 * Read stage lock metadata, mirroring cli/src/lock.js checkLock() staleness rules.
 * @param {string} projectId
 * @param {number|string} stageN
 * @returns {{locked_by: string, hostname: string, pid: number, locked_at: string}|null}
 */
function checkStageLock(projectId, stageN) {
  const lockPath = path.join(getProjectsDir(), projectId, `.stage_${stageN}.lock`);
  if (!fs.existsSync(lockPath)) return null;

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    return null; // corrupt file — treat as unlocked
  }

  const ageMs = Date.now() - new Date(lock.locked_at).getTime();
  if (ageMs > STALE_MINUTES * 60 * 1000) return null; // stale — CLI will reclaim it

  return lock;
}

/**
 * @param {{locked_by: string, hostname: string, pid: number, locked_at: string}} lock
 * @returns {string}
 */
function formatLockInfo(lock) {
  const age = Math.round((Date.now() - new Date(lock.locked_at).getTime()) / 60000);
  return `${lock.locked_by}@${lock.hostname} (PID ${lock.pid}), locked ${age} min ago`;
}

/**
 * @param {string} toolName
 * @returns {boolean}
 */
function isBabokTool(toolName) {
  return typeof toolName === 'string' && /babok_/i.test(toolName);
}

/**
 * @param {string} toolName
 * @param {string} suffix
 * @returns {boolean}
 */
function toolMatches(toolName, suffix) {
  return isBabokTool(toolName) && toolName.includes(suffix);
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let payload = {};
  try {
    payload = JSON.parse(input || '{}');
  } catch {
    process.exit(0);
  }

  const toolName = payload.tool_name || payload.toolName || '';
  const toolInput = payload.tool_input || payload.toolInput || payload.toolArgs || {};

  if (toolMatches(toolName, 'babok_approve_stage')) {
    deny('babok_approve_stage is blocked for agents. Human must run: babok approve <project_id> <stage>');
  }

  if (toolMatches(toolName, 'babok_save_deliverable')) {
    const projectId = resolveProjectId(toolInput.project_id || toolInput.projectId);
    const stageN = toolInput.stage_n ?? toolInput.stageN;
    if (projectId == null || stageN == null) process.exit(0);

    const lock = checkStageLock(projectId, stageN);
    if (lock) {
      deny(
        `stage ${stageN} is locked by ${formatLockInfo(lock)} (babok chat/run in progress). Wait for the lock to release before babok_save_deliverable.`,
      );
    }

    const journal = readJournal(projectId);
    if (!journal) process.exit(0);

    const stage = journal.stages?.find(s => s.stage === Number(stageN));
    if (!stage) process.exit(0);

    const revisionOpen = stage.revision_open === true;
    if (stage.status === 'approved' && !revisionOpen) {
      deny(`stage ${stageN} is approved and locked. Call babok_open_revision before babok_save_deliverable.`);
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
