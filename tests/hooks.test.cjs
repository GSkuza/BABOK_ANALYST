#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
}

function run(script, env) {
  return spawnSync(process.execPath, [path.join(root, 'hooks', script)], {
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

delete process.env.CLAUDE_CONFIG_DIR;
delete process.env.PLUGIN_DATA;
delete process.env.COPILOT_PLUGIN_DATA;

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-hooks-'));
process.on('exit', () => fs.rmSync(temp, { recursive: true, force: true }));

const home = path.join(temp, 'home');
const pluginData = path.join(temp, 'plugin-data');
fs.mkdirSync(home, { recursive: true });

const codexEnv = {
  HOME: home,
  USERPROFILE: home,
  PLUGIN_DATA: pluginData,
  CLAUDE_PLUGIN_ROOT: root,
};

let result = run('babok-activate.cjs', codexEnv);
assert.equal(result.status, 0, result.stderr);
const output = JSON.parse(result.stdout);
assert.equal(output.systemMessage, 'BABOK_ANALYST:ACTIVE');
assert.match(output.hookSpecificOutput.additionalContext, /BABOK/);

const statePath = path.join(pluginData, '.babok-analyst-active');
assert.equal(fs.readFileSync(statePath, 'utf8'), 'active');

const hooksJson = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'claude-codex-hooks.json'), 'utf8'));
assert.ok(hooksJson.hooks.SessionStart);
assert.ok(hooksJson.hooks.SessionEnd, 'SessionEnd hook configured for state cleanup');

// babok-deactivate clears the active-state flag on SessionEnd
const deactivate = run('babok-deactivate.cjs', codexEnv);
assert.equal(deactivate.status, 0, deactivate.stderr);
assert.equal(fs.existsSync(statePath), false, 'state file should be removed by babok-deactivate');
assert.equal(
  readJSON(path.join(root, '.claude-plugin', 'plugin.json')).hooks,
  './hooks/claude-codex-hooks.json',
);

assert.ok(hooksJson.hooks.PreToolUse, 'PreToolUse hook configured for Two-Key gate');

// babok-gate blocks agent approve_stage
const gateEnv = {
  ...codexEnv,
  BABOK_PROJECTS_DIR: path.join(temp, 'projects'),
};
fs.mkdirSync(gateEnv.BABOK_PROJECTS_DIR, { recursive: true });
const gateBlock = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({
      tool_name: 'mcp__babok__babok_approve_stage',
      tool_input: { project_id: 'X', stage_n: 0 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(gateBlock.status, 2, 'babok_approve_stage should be blocked');
assert.match(gateBlock.stderr, /Two-Key Gate/);

// babok-gate blocks save_deliverable while a human holds .stage_N.lock
const lockProjectId = 'BABOK-20260101-LOCK';
const lockProjectDir = path.join(gateEnv.BABOK_PROJECTS_DIR, lockProjectId);
fs.mkdirSync(lockProjectDir, { recursive: true });
fs.writeFileSync(
  path.join(lockProjectDir, '.stage_1.lock'),
  JSON.stringify({ locked_by: 'alice', hostname: 'alice-pc', pid: 4242, locked_at: new Date().toISOString() }),
);
const lockBlock = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({
      tool_name: 'mcp__babok__babok_save_deliverable',
      tool_input: { project_id: lockProjectId, stage_n: 1 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(lockBlock.status, 2, 'save_deliverable should be blocked while stage lock is held');
assert.match(lockBlock.stderr, /locked by alice@alice-pc/);

// stale lock (>2h old) is ignored
fs.writeFileSync(
  path.join(lockProjectDir, '.stage_1.lock'),
  JSON.stringify({ locked_by: 'alice', hostname: 'alice-pc', pid: 4242, locked_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }),
);
const staleLockPass = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({
      tool_name: 'mcp__babok__babok_save_deliverable',
      tool_input: { project_id: lockProjectId, stage_n: 1 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(staleLockPass.status, 0, 'stale stage lock should not block save_deliverable');

// gate resolves consulting-profile (BC-) project IDs and enforces the approved lock on them too
const bcProjectId = 'BC-20260101-CONS';
const bcProjectDir = path.join(gateEnv.BABOK_PROJECTS_DIR, bcProjectId);
fs.mkdirSync(bcProjectDir, { recursive: true });
fs.writeFileSync(
  path.join(bcProjectDir, `PROJECT_JOURNAL_${bcProjectId}.json`),
  JSON.stringify({
    project_id: bcProjectId,
    profile: 'consulting',
    stages: [
      { stage: 0, status: 'approved', revision_open: false },
      { stage: 1, status: 'in_progress', revision_open: false },
    ],
  }),
);
const bcApprovedBlock = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({
      tool_name: 'mcp__babok__babok_save_deliverable',
      tool_input: { project_id: 'CONS', stage_n: 0 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(bcApprovedBlock.status, 2, 'save on an approved stage of a BC- project must be blocked');
assert.match(bcApprovedBlock.stderr, /approved and locked/);

assert.ok(hooksJson.hooks.PostToolUse, 'PostToolUse hook configured for quality gate');

// babok-quality-gate scores a submitted deliverable and reports issues, non-blocking
const scoreProjectId = 'BABOK-20260101-SCORE';
const scoreProjectDir = path.join(gateEnv.BABOK_PROJECTS_DIR, scoreProjectId);
fs.mkdirSync(scoreProjectDir, { recursive: true });
fs.copyFileSync(
  path.join(root, 'tests', 'fixtures', 'invalid_stage1_no_kpi_numbers.md'),
  path.join(scoreProjectDir, 'STAGE_01_Project_Initialization.md'),
);
const qualityGate = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-quality-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({
      tool_name: 'mcp__babok__babok_submit_for_review',
      tool_input: { project_id: scoreProjectId, stage_n: 1 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(qualityGate.status, 0, 'quality gate must never block (PostToolUse)');
const qualityOutput = JSON.parse(qualityGate.stdout);
assert.equal(qualityOutput.hookSpecificOutput.hookEventName, 'PostToolUse');
assert.match(qualityOutput.hookSpecificOutput.additionalContext, /Score: \d+\/100/);
assert.match(qualityOutput.hookSpecificOutput.additionalContext, /\[warning\]/);

// Copilot CLI host: flat { additionalContext }, toolArgs field, camelCase toolName
const copilotEnv = { ...gateEnv, COPILOT_PLUGIN_DATA: path.join(temp, 'copilot-plugin-data') };
const qualityGateCopilot = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-quality-gate.cjs')],
  {
    env: copilotEnv,
    input: JSON.stringify({
      toolName: 'babok_submit_for_review',
      toolArgs: { project_id: scoreProjectId, stage_n: 1 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(qualityGateCopilot.status, 0, 'quality gate must never block on Copilot either');
const copilotOutput = JSON.parse(qualityGateCopilot.stdout);
assert.equal(copilotOutput.hookSpecificOutput, undefined, 'Copilot output must be flat, not nested');
assert.match(copilotOutput.additionalContext, /Score: \d+\/100/);

const copilotHooksJson = JSON.parse(fs.readFileSync(path.join(root, 'hooks', 'copilot-hooks.json'), 'utf8'));
assert.ok(copilotHooksJson.hooks.postToolUse, 'Copilot postToolUse hook configured for quality gate');
assert.ok(copilotHooksJson.hooks.preToolUse, 'Copilot preToolUse hook configured for Two-Key gate');
assert.ok(copilotHooksJson.hooks.sessionEnd, 'Copilot sessionEnd hook configured for state cleanup');

// babok-deactivate clears state under Copilot's own plugin-data dir too
const copilotStatePath = path.join(copilotEnv.COPILOT_PLUGIN_DATA, '.babok-analyst-active');
fs.mkdirSync(path.dirname(copilotStatePath), { recursive: true });
fs.writeFileSync(copilotStatePath, 'active');
const deactivateCopilot = run('babok-deactivate.cjs', copilotEnv);
assert.equal(deactivateCopilot.status, 0, deactivateCopilot.stderr);
assert.equal(fs.existsSync(copilotStatePath), false, 'Copilot state file should be removed by babok-deactivate');

// babok-gate on Copilot CLI: exit 2 alone does not block there — must deny via
// stdout permissionDecision, and exit 0 (a non-zero non-2 exit fails closed on Copilot)
const gateBlockCopilot = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: copilotEnv,
    input: JSON.stringify({
      toolName: 'babok_approve_stage',
      toolArgs: { project_id: 'X', stage_n: 0 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(gateBlockCopilot.status, 0, 'Copilot deny path must exit 0, not rely on exit code to block');
const gateBlockCopilotOutput = JSON.parse(gateBlockCopilot.stdout);
assert.equal(gateBlockCopilotOutput.permissionDecision, 'deny');
assert.match(gateBlockCopilotOutput.permissionDecisionReason, /babok_approve_stage is blocked/);

// lockProjectDir's lock was reset to stale earlier in this script — reinstate a fresh one
fs.writeFileSync(
  path.join(lockProjectDir, '.stage_1.lock'),
  JSON.stringify({ locked_by: 'alice', hostname: 'alice-pc', pid: 4242, locked_at: new Date().toISOString() }),
);
const lockBlockCopilot = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-gate.cjs')],
  {
    env: copilotEnv,
    input: JSON.stringify({
      toolName: 'babok_save_deliverable',
      toolArgs: { project_id: lockProjectId, stage_n: 1 },
    }),
    encoding: 'utf8',
  },
);
assert.equal(lockBlockCopilot.status, 0);
assert.equal(JSON.parse(lockBlockCopilot.stdout).permissionDecision, 'deny');

// ignores unrelated tools
const qualityGateSkip = spawnSync(
  process.execPath,
  [path.join(root, 'hooks', 'babok-quality-gate.cjs')],
  {
    env: gateEnv,
    input: JSON.stringify({ tool_name: 'mcp__babok__babok_list_projects', tool_input: {} }),
    encoding: 'utf8',
  },
);
assert.equal(qualityGateSkip.status, 0);
assert.equal(qualityGateSkip.stdout, '');

console.log('hooks checks passed');
