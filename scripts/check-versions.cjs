#!/usr/bin/env node
// Version-consistency guard across all plugin host manifests.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PINNED_SEMVER = /^\d+\.\d+\.\d+$/;

const VERSION_FILES = [
  '.claude-plugin/plugin.json',
  '.codex-plugin/plugin.json',
  '.github/plugin/plugin.json',
  'gemini-extension.json',
  'package.json',
  'cli/package.json',
  'web/package.json',
  'babok-mcp/package.json',
  'plugins/babok_analyst/babok-mcp/package.json',
  'plugins/babok_analyst/.codex-plugin/plugin.json',
];

function readVersion(relPath) {
  const raw = fs.readFileSync(path.join(root, relPath), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw).version;
}

let failed = false;
const versions = VERSION_FILES.map((relPath) => {
  const version = readVersion(relPath);
  if (typeof version !== 'string' || !PINNED_SEMVER.test(version)) {
    console.error(`${relPath}: version must be pinned X.Y.Z semver, got ${JSON.stringify(version)}`);
    failed = true;
  }
  return [relPath, version];
});

const distinct = [...new Set(versions.map(([, v]) => v))];
if (distinct.length > 1) {
  console.error('Version mismatch — every manifest must share one version:');
  for (const [relPath, version] of versions) console.error(`  ${version}\t${relPath}`);
  failed = true;
}

const shared = distinct.length === 1 ? distinct[0] : null;

try {
  const versionFile = fs.readFileSync(path.join(root, 'VERSION'), 'utf8').replace(/^\uFEFF/, '').trim();
  if (shared && versionFile !== shared) {
    console.error(`VERSION file (${versionFile}) does not match manifests (${shared})`);
    failed = true;
  }
} catch (e) {
  console.error(`VERSION file: ${e.message}`);
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log(`All ${VERSION_FILES.length} version files pinned at ${shared}.`);
