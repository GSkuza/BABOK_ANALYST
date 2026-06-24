#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const PINNED_SEMVER = /^\d+\.\d+\.\d+$/;

function readJSON(relPath) {
  const raw = fs.readFileSync(path.join(root, relPath), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

test('marketplace lists babok_analyst plugin', () => {
  const marketplace = readJSON('.claude-plugin/marketplace.json');
  assert.equal(marketplace.name, 'babok_analyst');
  assert.equal(marketplace.plugins.length, 1);
  assert.equal(marketplace.plugins[0].name, 'babok_analyst');
  assert.equal(marketplace.plugins[0].source, './');
});

test('Claude plugin manifest is schema-valid (minimal + explicit hooks only)', () => {
  const manifest = readJSON('.claude-plugin/plugin.json');
  assert.equal(manifest.name, 'babok_analyst');
  assert.match(manifest.version, PINNED_SEMVER);
  assert.equal(manifest.hooks, './hooks/claude-codex-hooks.json');
  assert.equal(manifest.agents, undefined, 'agents must auto-discover from agents/ — not be set in manifest');
  assert.equal(manifest.commands, undefined, 'commands must auto-discover from commands/');
  assert.equal(manifest.skills, undefined, 'skills must auto-discover from skills/');
  assert.equal(manifest.mcpServers, undefined, 'MCP must auto-discover from .mcp.json at plugin root');
});

test('Codex and Copilot manifests share version with Claude', () => {
  const claude = readJSON('.claude-plugin/plugin.json').version;
  const codex = readJSON('.codex-plugin/plugin.json').version;
  const copilot = readJSON('.github/plugin/plugin.json').version;
  assert.equal(codex, claude);
  assert.equal(copilot, claude);
});

test('MCP config uses portable plugin-root variables', () => {
  const mcp = readJSON('.mcp.json');
  const babok = mcp.mcpServers.babok;
  assert.ok(babok.args[0].includes('${CLAUDE_PLUGIN_ROOT}'));
  assert.equal(babok.env.BABOK_PLUGIN_ROOT, '${CLAUDE_PLUGIN_ROOT}');
  assert.equal(babok.env.BABOK_PROJECTS_DIR, '${CLAUDE_PROJECT_DIR}/projects');
  assert.equal(babok.env.BABOK_AGENT_DIR, '${CLAUDE_PLUGIN_ROOT}/BABOK_AGENT/stages');
});

test('Claude slash commands are .md files in commands/', () => {
  for (const file of ['babok-new.md', 'babok-status.md', 'babok-help.md']) {
    assert.ok(
      fs.existsSync(path.join(root, 'commands', file)),
      `missing Claude command: commands/${file}`,
    );
  }
});

test('command files exist for Copilot plugin surface', () => {
  const manifest = readJSON('.github/plugin/plugin.json');
  for (const file of ['babok-new.toml', 'babok-status.toml', 'babok-help.toml']) {
    assert.ok(
      fs.existsSync(path.join(root, manifest.commands, file)),
      `missing command: ${manifest.commands}${file}`,
    );
  }
});

test('babok-analyst skill is bundled', () => {
  assert.ok(fs.existsSync(path.join(root, 'skills', 'babok-analyst', 'SKILL.md')));
});

test('agents bundle is present for Claude plugin', () => {
  assert.ok(fs.existsSync(path.join(root, 'agents', 'babok-orchestrator.md')));
});
