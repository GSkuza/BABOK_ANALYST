/**
 * Pure, file-I/O-free scoring core: checks already-in-memory content against
 * a stage's rubric entry. Deliberately dependency-free (only the check
 * functions below, all themselves pure) so this file can be mirrored
 * byte-for-byte into babok-mcp/src/lib/quality/score-content.js and reused by
 * the MCP `babok_quality_check` tool without dragging in any CLI-specific
 * project/journal/profile module.
 *
 * @typedef {{ dimension: string, ruleId: string, severity: 'error'|'warning'|'info', message: string, remediation: string }} ScorerIssue
 */

import { checkCompleteness } from './checks/completeness.js';
import { checkSmart } from './checks/smart.js';
import { checkConsistency } from './checks/consistency.js';
import { checkDepth } from './checks/depth.js';

/** Case-insensitive substring match, same heuristic as completeness.js's sectionPresent(). */
function matchesScope(name, scopeLower) {
  const lower = name.toLowerCase();
  return scopeLower.some(sc => lower.includes(sc) || sc.includes(lower));
}

/** Filter required_sections down to the ones relevant to a partial (batch) draft. */
function scopeRequiredSections(sections, scope) {
  if (!scope || scope.length === 0) return sections || [];
  const scopeLower = scope.map(s => s.toLowerCase());
  return (sections || []).filter(s => matchesScope(s, scopeLower));
}

/** Filter quality_criteria down to the ones whose applies_to falls within scope. */
function scopeQualityCriteria(criteria, scope) {
  if (!scope || scope.length === 0) return criteria || [];
  const scopeLower = scope.map(s => s.toLowerCase());
  return (criteria || []).filter(c => {
    const appliesTo = c.applies_to || '';
    if (!appliesTo) return true; // no section binding — can't scope, keep it
    return matchesScope(appliesTo, scopeLower);
  });
}

/**
 * Score already-in-memory content against a stage's rubric entry.
 *
 * @param {string} content
 * @param {object} stageRubric - rubric.stages[`stage${n}`]
 * @param {object} rubric - full rubric object (for global scoring defaults/version)
 * @param {{
 *   llmClient?: { chat(systemPrompt: string, userMessage: string): Promise<string> },
 *   includeDepth?: boolean,
 *   sectionsScope?: string[],
 *   stageNumber?: number,
 * }} [options]
 * @returns {Promise<{ scores: object, passed: boolean, issues: ScorerIssue[], rubricVersion: string }>}
 */
export async function scoreContent(content, stageRubric, rubric, options = {}) {
  const { llmClient, includeDepth = false, sectionsScope, stageNumber } = options;

  const requiredSections = scopeRequiredSections(stageRubric.required_sections, sectionsScope);
  const qualityCriteria = scopeQualityCriteria(stageRubric.quality_criteria, sectionsScope);

  // Consistency checks reference cross-stage/whole-document facts and already
  // degrade gracefully when a referenced section isn't in `content` yet
  // (see checks/consistency.js) — no scoping needed here.
  const completenessResult = checkCompleteness(content, requiredSections);
  const smartResult = checkSmart(content, qualityCriteria);
  const consistencyResult = checkConsistency(content, stageRubric.consistency_checks || [], stageRubric.builtin_consistency);

  let depthResult = null;
  if (includeDepth && llmClient) {
    depthResult = await checkDepth(content, { stageNumber, llmClient, sectionsScope });
  }

  // Weights from rubric (fall back to global defaults). When depth is
  // included, proportionally redistribute so the four weights still sum to
  // 1 — omitting `includeDepth` reproduces today's exact weights/output.
  const weights = stageRubric.weights || rubric.scoring || {};
  let wComp = weights.completeness ?? 0.4;
  let wCons = weights.consistency ?? 0.3;
  let wQual = weights.quality ?? 0.3;
  let wDepth = 0;

  if (depthResult) {
    wDepth = weights.depth ?? 0.15;
    const baseSum = wComp + wCons + wQual;
    if (baseSum > 0) {
      const scale = (1 - wDepth) / baseSum;
      wComp *= scale;
      wCons *= scale;
      wQual *= scale;
    }
  }

  const overall =
    completenessResult.score * wComp +
    consistencyResult.score * wCons +
    smartResult.score * wQual +
    (depthResult ? depthResult.score * wDepth : 0);

  const roundedOverall = Math.round(overall * 10) / 10;
  const minScore = rubric.scoring?.min_overall_score ?? 75; // 75 is the BABOK standard default

  const scores = {
    completeness: completenessResult.score,
    consistency: consistencyResult.score,
    quality: smartResult.score,
    overall: roundedOverall,
  };
  if (depthResult) scores.depth = depthResult.score;

  return {
    scores,
    passed: roundedOverall >= minScore,
    issues: [
      ...completenessResult.issues,
      ...smartResult.issues,
      ...consistencyResult.issues,
      ...(depthResult ? depthResult.issues : []),
    ],
    rubricVersion: rubric.version,
  };
}
