#!/usr/bin/env node
/**
 * PostToolUse hook — auto-scores and cross-stage-validates a deliverable right
 * after babok_submit_for_review, feeding issues back to the agent immediately
 * instead of waiting for a manual `babok score` / `babok validate` call.
 *
 * Never blocks: the tool already ran. Exit 0 always; feedback goes through
 * host-specific additionalContext:
 * - Claude Code / Codex: { hookSpecificOutput: { hookEventName, additionalContext } }
 * - Copilot CLI:         { additionalContext } (flat — see docs.github.com/en/copilot/reference/hooks-reference)
 */

const path = require('path');
const { pathToFileURL } = require('url');
const { getPluginRoot, getProjectsDir, resolveProjectId } = require('./babok-config.cjs');
const { isCopilot } = require('./babok-runtime.cjs');

const MAX_ISSUES = 5;

/**
 * @param {string} toolName
 * @returns {boolean}
 */
function isSubmitForReview(toolName) {
  return typeof toolName === 'string' && /babok_submit_for_review/i.test(toolName);
}

/**
 * @param {{severity: string, message: string}[]} issues
 * @returns {string}
 */
function formatIssues(issues) {
  const relevant = issues.filter(i => i.severity === 'error' || i.severity === 'warning');
  if (relevant.length === 0) return '';
  const shown = relevant.slice(0, MAX_ISSUES)
    .map(i => `  - [${i.severity}] ${i.message}`)
    .join('\n');
  const more = relevant.length > MAX_ISSUES ? `\n  ...and ${relevant.length - MAX_ISSUES} more` : '';
  return `${shown}${more}`;
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
  if (!isSubmitForReview(toolName)) process.exit(0);

  const toolInput = payload.tool_input || payload.toolInput || payload.toolArgs || {};
  const projectId = resolveProjectId(toolInput.project_id || toolInput.projectId);
  const stageN = Number(toolInput.stage_n ?? toolInput.stageN);
  if (projectId == null || Number.isNaN(stageN)) process.exit(0);

  const projectDir = path.join(getProjectsDir(), projectId);
  const pluginRoot = getPluginRoot();

  const lines = [`Quality gate — ${projectId} stage ${stageN}:`];

  try {
    if (stageN >= 1 && stageN <= 8) {
      const { scoreStage } = await import(
        pathToFileURL(path.join(pluginRoot, 'cli', 'src', 'quality', 'scorer.js')).href
      );
      const report = await scoreStage(projectId, stageN, { projectDir });
      lines.push(
        `  Score: ${report.scores.overall}/100 (${report.passed ? 'PASS' : 'BELOW THRESHOLD'})`,
      );
      const issueText = formatIssues(report.issues);
      if (issueText) lines.push(issueText);
    }
  } catch (e) {
    lines.push(`  Score: unavailable (${e.message})`);
  }

  try {
    const { validateProject } = await import(
      pathToFileURL(path.join(pluginRoot, 'cli', 'src', 'validation', 'cross-stage-validator.js')).href
    );
    const report = await validateProject(projectId, { projectDir });
    const issueText = formatIssues(report.findings);
    if (issueText) {
      lines.push('  Cross-stage validation:');
      lines.push(issueText);
    }
  } catch (e) {
    lines.push(`  Cross-stage validation: unavailable (${e.message})`);
  }

  const additionalContext = lines.join('\n');
  process.stdout.write(JSON.stringify(
    isCopilot
      ? { additionalContext }
      : { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext } },
  ));
  process.exit(0);
}

main().catch(() => process.exit(0));
