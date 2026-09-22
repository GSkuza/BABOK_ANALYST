/**
 * LLM-judged "depth/specificity" check. The deterministic checks
 * (completeness/smart/consistency) cannot tell generic bureaucratic filler
 * from genuine root-cause analysis — this is the semantic complement,
 * graded against the same standard the deliverable was written to
 * (see cli/src/reasoning/prompts/analyst.md's "Depth" criterion).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_PATH = path.join(__dirname, '..', 'prompts', 'depth_judge.md');

let _promptCache = null;
function loadDepthPrompt() {
  if (_promptCache === null) {
    _promptCache = fs.readFileSync(PROMPT_PATH, 'utf-8');
  }
  return _promptCache;
}

function parseJudgeResponse(response) {
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : response;
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;
  try {
    return JSON.parse(objMatch[0]);
  } catch {
    return null;
  }
}

/**
 * @param {string} content
 * @param {{
 *   stageNumber: number,
 *   llmClient?: { chat(systemPrompt: string, userMessage: string): Promise<string> },
 *   sectionsScope?: string[],
 * }} options
 * @returns {Promise<{ score: number, issues: import('../scorer.js').ScorerIssue[] }>}
 */
export async function checkDepth(content, options = {}) {
  const { stageNumber, llmClient, sectionsScope } = options;

  if (!llmClient) {
    // No LLM available to judge with — don't penalise, just skip (caller decides
    // whether to include this dimension at all via scoreContent's includeDepth flag).
    return { score: 100, issues: [] };
  }

  const scopeNote = sectionsScope?.length
    ? `\n\nOnly evaluate these sections (the rest of the document may be incomplete or absent): ${sectionsScope.join(', ')}`
    : '';
  const userMessage =
    `Grade the depth of this BABOK Stage ${stageNumber} deliverable (or partial draft).${scopeNote}\n\n` +
    `CONTENT:\n${content}`;

  let judgeObj = null;
  try {
    const response = await llmClient.chat(loadDepthPrompt(), userMessage);
    judgeObj = parseJudgeResponse(response);
  } catch {
    judgeObj = null;
  }

  if (!judgeObj || typeof judgeObj.score !== 'number') {
    return {
      score: 50,
      issues: [{
        dimension: 'depth',
        ruleId: 'DEPTH-JUDGE-ERROR',
        severity: 'warning',
        message: 'Depth judge did not return a parseable score',
        remediation: 'Re-run the depth check; if this persists, verify the LLM client and depth_judge.md prompt',
      }],
    };
  }

  const findings = Array.isArray(judgeObj.findings) ? judgeObj.findings : [];
  const issues = findings.map((f, i) => ({
    dimension: 'depth',
    ruleId: `DEPTH-${i + 1}`,
    severity: 'warning',
    message: `${f.section ? `[${f.section}] ` : ''}${f.issue}`,
    remediation: 'Replace generic/unsupported statements with project-specific, evidence-backed analysis.',
  }));

  return { score: Math.max(0, Math.min(100, judgeObj.score)), issues };
}
