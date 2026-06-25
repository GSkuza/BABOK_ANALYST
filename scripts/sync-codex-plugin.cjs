#!/usr/bin/env node
/**
 * Materialize the Codex plugin bundle under plugins/babok_analyst/.
 *
 * Codex rejects marketplace source path "./" (empty relative path after "./").
 * The plugin must live in a non-root subdirectory, e.g. ./plugins/babok_analyst.
 * This script copies the portable plugin surface from the repo root so Git installs
 * work without Windows junctions or symlinks.
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dest = path.join(root, 'plugins', 'babok_analyst');

/** @type {string[]} */
const COPY_DIRS = ['skills', 'hooks', 'commands', 'agents', 'babok-mcp', 'BABOK_AGENT', 'assets'];

/** @type {string[]} */
const COPY_FILES = ['.mcp.json', '.codexignore', 'SECURITY.md', 'LICENSE', 'README.md'];

/**
 * Remove a path recursively when it exists.
 * @param {string} target
 */
function removeIfExists(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

/**
 * Copy a directory tree, skipping node_modules.
 * @param {string} from
 * @param {string} to
 */
function copyDir(from, to) {
  fs.cpSync(from, to, {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes('node_modules'),
  });
}

fs.mkdirSync(dest, { recursive: true });

removeIfExists(path.join(dest, '.codex-plugin'));
fs.cpSync(path.join(root, '.codex-plugin'), path.join(dest, '.codex-plugin'), { recursive: true });

for (const file of COPY_FILES) {
  fs.copyFileSync(path.join(root, file), path.join(dest, file));
}

for (const dir of COPY_DIRS) {
  const from = path.join(root, dir);
  const to = path.join(dest, dir);
  removeIfExists(to);
  copyDir(from, to);
}

console.log(`Synced Codex plugin bundle to ${path.relative(root, dest)}`);
