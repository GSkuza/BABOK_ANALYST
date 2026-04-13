/**
 * Quality Scorer — orchestrates completeness, SMART/quality, and consistency
 * checks against the stage rubric and saves a score report to disk.
 *
 * @typedef {{ dimension: string, ruleId: string, severity: 'error'|'warning'|'info', message: string, remediation: string }} ScorerIssue
 * @typedef {{ projectId: string, stage: number, timestamp: string, scores: { completeness: number, consistency: number, quality: number, overall: number }, passed: boolean, issues: ScorerIssue[], rubricVersion: string }} ScoreReport
 */

import { readFileSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProjectDir } from '../project.js';
import { checkCompleteness } from './checks/completeness.js';
import { checkSmart } from './checks/smart.js';
import { checkConsistency } from './checks/consistency.js';

// Resolve rubric relative to this file: cli/src/quality/scorer.js
// Going up 3 levels reaches the repo root (BABOK_ANALYST/).
const RUBRIC_URL = new URL('../../../BABOK_AGENT/agents/quality_scoring_rubric.json', import.meta.url);

let _rubricCache = null;
function loadRubric() {
  if (!_rubricCache) {
    _rubricCache = JSON.parse(readFileSync(fileURLToPath(RUBRIC_URL), 'utf-8'));
  }
  return _rubricCache;
}

/**
 * Find the deliverable markdown file for a given stage in the project directory.
 * Looks for STAGE_NN_*.md files.
 *
 * @param {string} projectDir
 * @param {number} stageNumber
 * @returns {string|null} absolute path to the file, or null if not found
 */
function findDeliverable(projectDir, stageNumber) {
  const prefix = `STAGE_${String(stageNumber).padStart(2, '0')}_`;
  const files = readdirSync(projectDir).filter(
    f => f.startsWith(prefix) && f.endsWith('.md')
  );
  return files.length > 0 ? path.join(projectDir, files[0]) : null;
}

/**
 * Score a single stage deliverable against the rubric.
 *
 * @param {string} projectId
 * @param {number} stageNumber - 1-8
 * @param {{ projectDir?: string, scoresDir?: string }} [options]
 * @returns {Promise<ScoreReport>}
 */
export async function scoreStage(projectId, stageNumber, options = {}) {
  const rubric = loadRubric();
  const stageKey = `stage${stageNumber}`;
  const stageRubric = rubric.stages[stageKey];
  if (!stageRubric) {
    throw new Error(`No rubric entry found for stage ${stageNumber}`);
  }

  const projectDir = options.projectDir || getProjectDir(projectId);
  const deliverablePath = findDeliverable(projectDir, stageNumber);
  if (!deliverablePath) {
    throw new Error(
      `No deliverable found for stage ${stageNumber} in ${projectDir} (expected STAGE_${String(stageNumber).padStart(2, '0')}_*.md)`
    );
  }

  const content = readFileSync(deliverablePath, 'utf-8');

  // --- Run checks ---
  const completenessResult = checkCompleteness(content, stageRubric.required_sections || []);
  const smartResult = checkSmart(content, stageRubric.quality_criteria || []);
  const consistencyResult = checkConsistency(content, stageRubric.consistency_checks || [], stageNumber);

  // Weights from rubric (fall back to global defaults)
  const weights = stageRubric.weights || rubric.scoring || {};
  const wComp = weights.completeness ?? 0.4;
  const wCons = weights.consistency ?? 0.3;
  const wQual = weights.quality ?? 0.3;

  const overall =
    completenessResult.score * wComp +
    consistencyResult.score * wCons +
    smartResult.score * wQual;

  const roundedOverall = Math.round(overall * 10) / 10;
  const minScore = rubric.scoring?.min_overall_score ?? 75; // 75 is the BABOK standard default

  /** @type {ScoreReport} */
  const report = {
    projectId,
    stage: stageNumber,
    timestamp: new Date().toISOString(),
    scores: {
      completeness: completenessResult.score,
      consistency: consistencyResult.score,
      quality: smartResult.score,
      overall: roundedOverall,
    },
    passed: roundedOverall >= minScore,
    issues: [
      ...completenessResult.issues,
      ...smartResult.issues,
      ...consistencyResult.issues,
    ],
    rubricVersion: rubric.version,
  };

  // --- Persist score report ---
  const scoresDir = options.scoresDir || path.join(projectDir, 'scores');
  mkdirSync(scoresDir, { recursive: true });
  const scoreFile = path.join(
    scoresDir,
    `STAGE_${String(stageNumber).padStart(2, '0')}_score.json`
  );
  writeFileSync(scoreFile, JSON.stringify(report, null, 2), 'utf-8');

  return report;
}

/**
 * Score all 8 stages that have a deliverable present.
 *
 * @param {string} projectId
 * @param {{ projectDir?: string, scoresDir?: string }} [options]
 * @returns {Promise<ScoreReport[]>}
 */
export async function scoreAll(projectId, options = {}) {
  const projectDir = options.projectDir || getProjectDir(projectId);
  const results = [];

  for (let stage = 1; stage <= 8; stage++) {
    const deliverablePath = findDeliverable(projectDir, stage);
    if (!deliverablePath) continue; // skip stages with no deliverable
    try {
      const report = await scoreStage(projectId, stage, options);
      results.push(report);
    } catch (err) {
      // Surface as a failed "error" report rather than crashing
      results.push({
        projectId,
        stage,
        timestamp: new Date().toISOString(),
        scores: { completeness: 0, consistency: 0, quality: 0, overall: 0 },
        passed: false,
        issues: [{ dimension: 'scorer', ruleId: 'SCORER-ERROR', severity: 'error', message: err.message, remediation: 'Ensure the deliverable file exists and is valid markdown.' }],
        rubricVersion: 'unknown',
      });
    }
  }

  return results;
}
