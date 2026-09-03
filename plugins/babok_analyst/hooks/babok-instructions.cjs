#!/usr/bin/env node
// Shared BABOK Analyst instruction builder for lifecycle hooks.

const fs = require('fs');
const path = require('path');
const { getPluginRoot } = require('./babok-config.cjs');

const SKILL_PATH = path.join(getPluginRoot(), 'skills', 'babok-analyst', 'SKILL.md');
const AGENTS_PATH = path.join(getPluginRoot(), 'AGENTS.md');

function stripFrontmatter(body) {
  return String(body || '').replace(/^---[\s\S]*?---\s*/, '');
}

/**
 * Load compact BABOK operating instructions for session activation.
 * @returns {string}
 */
function getBabokInstructions() {
  for (const filePath of [SKILL_PATH, AGENTS_PATH]) {
    try {
      if (fs.existsSync(filePath)) {
        return stripFrontmatter(fs.readFileSync(filePath, 'utf8')).trim();
      }
    } catch (e) {
      // fall through to built-in fallback
    }
  }

  return [
    'BABOK ANALYST MODE ACTIVE',
    '',
    'You are a senior Business Analyst working to BABOK v3.',
    'Run the 9-stage pipeline (Stage 0 charter gate, Stages 1–8 deliverables). Projects may use another pipeline profile (e.g. "consulting", prefix BC-, stages 0–6, no IT delivery) — always follow the stage list from babok_get_stage.',
    'Ask questions sequentially; require explicit human approval before advancing.',
    'Store project data under projects/<project_id>/ (not BABOK_Analysis/).',
    'Use babok MCP tools when available: babok_new_project, babok_get_stage, babok_save_deliverable, babok_submit_for_review. Human approves via `babok approve` CLI — agents must not call babok_approve_stage.',
  ].join('\n');
}

module.exports = {
  getBabokInstructions,
};
