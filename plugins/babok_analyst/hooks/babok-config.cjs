#!/usr/bin/env node
// babok_analyst — shared configuration resolver for plugin hooks.

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Resolve the plugin install root across Claude, Codex, and Copilot hosts.
 * @returns {string|null} Absolute path to the plugin bundle root.
 */
function getPluginRoot() {
  const candidates = [
    process.env.CLAUDE_PLUGIN_ROOT,
    process.env.PLUGIN_ROOT,
    process.env.CODEX_PLUGIN_ROOT,
    process.env.COPILOT_PLUGIN_ROOT,
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return path.resolve(candidate);
    }
  }
  return path.resolve(__dirname, '..');
}

/**
 * Resolve the per-user config directory for BABOK Analyst plugin state.
 * @returns {string}
 */
function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'babok-analyst');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'babok-analyst',
    );
  }
  return path.join(os.homedir(), '.config', 'babok-analyst');
}

/** @returns {string} */
function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * Resolve Claude/Codex config directory (mode flag, settings.json).
 * @returns {string}
 */
function getClaudeDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

/**
 * Guard against embedding unsafe shell metacharacters in generated commands.
 * @param {string} p
 * @returns {boolean}
 */
function isShellSafe(p) {
  return typeof p === 'string' && /^[A-Za-z0-9 _.\-:/\\~]+$/.test(p);
}

/**
 * Resolve the BABOK projects directory (matches babok-mcp project.js search order).
 * @returns {string}
 */
function getProjectsDir() {
  if (process.env.BABOK_PROJECTS_DIR && fs.existsSync(process.env.BABOK_PROJECTS_DIR)) {
    return path.resolve(process.env.BABOK_PROJECTS_DIR);
  }
  const cwdProjects = path.join(process.cwd(), 'projects');
  if (fs.existsSync(cwdProjects)) return cwdProjects;
  const rootProjects = path.join(getPluginRoot(), 'projects');
  if (fs.existsSync(rootProjects)) return rootProjects;
  return cwdProjects;
}

/**
 * Project-ID prefixes declared by profiles/<id>/profile.json (falls back to BABOK).
 * Hooks are CommonJS and cannot import the ESM profiles loader, so the files are read directly.
 * @returns {string[]}
 */
function getProjectIdPrefixes() {
  const prefixes = new Set(['BABOK']);
  const profilesDir = path.join(getPluginRoot(), 'profiles');
  try {
    for (const entry of fs.readdirSync(profilesDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const profilePath = path.join(profilesDir, entry.name, 'profile.json');
      if (!fs.existsSync(profilePath)) continue;
      const prefix = JSON.parse(fs.readFileSync(profilePath, 'utf8')).id_prefix;
      if (typeof prefix === 'string' && /^[A-Z][A-Z0-9]{1,7}$/.test(prefix)) prefixes.add(prefix);
    }
  } catch {
    // profiles dir optional in minimal installs
  }
  return [...prefixes];
}

/** @returns {RegExp} matches a project ID of any known profile (by prefix; `babok run` IDs carry a title slug) */
function getProjectIdRegex() {
  return new RegExp(`^(${getProjectIdPrefixes().join('|')})-[A-Z0-9_-]+$`);
}

/**
 * Resolve a full <PREFIX>-YYYYMMDD-XXXX project ID from a full or partial ID.
 * @param {string} partialId
 * @returns {string|null}
 */
function resolveProjectId(partialId) {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return null;
  const idRe = getProjectIdRegex();
  const ids = fs.readdirSync(dir).filter(name =>
    idRe.test(name) && fs.statSync(path.join(dir, name)).isDirectory(),
  );
  if (!partialId) return ids.length === 1 ? ids[0] : null;
  const exact = ids.find(id => id === partialId);
  if (exact) return exact;
  const upper = String(partialId).toUpperCase();
  const matches = ids.filter(id => id.includes(upper));
  return matches.length === 1 ? matches[0] : null;
}

module.exports = {
  getPluginRoot,
  getConfigDir,
  getConfigPath,
  getClaudeDir,
  isShellSafe,
  getProjectsDir,
  getProjectIdPrefixes,
  getProjectIdRegex,
  resolveProjectId,
};
