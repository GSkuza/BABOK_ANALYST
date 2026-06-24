#!/usr/bin/env node
/**
 * Cross-host MCP launcher for babok-mcp.
 *
 * Codex does not interpolate ${CLAUDE_PLUGIN_ROOT} in plugin .mcp.json, so the
 * server must resolve paths from this script location and ensure dependencies
 * exist before starting the stdio MCP transport.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pluginRoot = path.resolve(__dirname, '..');
const mcpDir = path.join(pluginRoot, 'babok-mcp');
const mcpEntry = path.join(mcpDir, 'bin', 'babok-mcp.js');
const nodeModules = path.join(mcpDir, 'node_modules');

/**
 * Ensure babok-mcp npm dependencies are installed in the plugin bundle.
 * @returns {void}
 */
function ensureMcpDependencies() {
  if (fs.existsSync(nodeModules)) return;
  if (!fs.existsSync(path.join(mcpDir, 'package.json'))) {
    console.error('babok-mcp package.json not found in plugin bundle.');
    process.exit(1);
  }
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['install', '--omit=dev'], {
    cwd: mcpDir,
    stdio: 'inherit',
    timeout: 120000,
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

/**
 * Walk upward from a directory looking for a projects/ folder with BABOK projects.
 * @param {string} startDir
 * @param {number} [maxDepth]
 * @returns {string|null}
 */
function findProjectsDirUpward(startDir, maxDepth = 8) {
  let dir = path.resolve(startDir);
  for (let depth = 0; depth < maxDepth; depth += 1) {
    for (const rel of ['projects', path.join('BABOK_ANALYST', 'projects')]) {
      const candidate = path.join(dir, rel);
      if (!fs.existsSync(candidate)) continue;
      const hasBabok = fs.readdirSync(candidate).some(
        (name) => name.startsWith('BABOK-') && fs.statSync(path.join(candidate, name)).isDirectory(),
      );
      if (hasBabok) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Resolve workspace projects directory for Codex/Claude hosts.
 * @returns {string|undefined}
 */
function resolveProjectsDir() {
  if (process.env.BABOK_PROJECTS_DIR && process.env.BABOK_PROJECTS_DIR !== '.') {
    return path.resolve(process.env.BABOK_PROJECTS_DIR);
  }
  if (process.env.CLAUDE_PROJECT_DIR) {
    return path.join(path.resolve(process.env.CLAUDE_PROJECT_DIR), 'projects');
  }
  if (process.env.CODEX_WORKSPACE_ROOT) {
    const fromCodex = findProjectsDirUpward(process.env.CODEX_WORKSPACE_ROOT);
    if (fromCodex) return fromCodex;
  }
  const fromCwd = findProjectsDirUpward(process.cwd());
  if (fromCwd) return fromCwd;
  return path.join(pluginRoot, 'projects');
}

ensureMcpDependencies();

const env = {
  ...process.env,
  BABOK_PLUGIN_ROOT: pluginRoot,
  BABOK_AGENT_DIR: path.join(pluginRoot, 'BABOK_AGENT', 'stages'),
  BABOK_PROJECTS_DIR: resolveProjectsDir(),
};

const child = spawnSync(process.execPath, [mcpEntry], {
  cwd: pluginRoot,
  env,
  stdio: 'inherit',
});

process.exit(child.status ?? 1);
