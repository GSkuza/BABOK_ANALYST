/**
 * Cross-Stage Consistency Validator
 *
 * Loads all stage deliverables for a project and runs each validation rule,
 * collecting findings across stages.
 *
 * @typedef {'error'|'warning'|'info'} Severity
 * @typedef {{ ruleId: string, severity: Severity, message: string, stagesInvolved: number[], remediation: string }} Finding
 * @typedef {{ projectId: string, timestamp: string, rulesRun: number, passed: number, failed: number, warnings: number, findings: Finding[] }} ValidationReport
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import path from 'path';
import { getProjectDir } from '../project.js';
import { ALL_RULES } from './rules/index.js';

/**
 * Load the markdown content of a stage deliverable.
 * Returns null if the file does not exist.
 *
 * @param {string} projectDir
 * @param {number} stageNumber
 * @returns {string|null}
 */
function loadStageContent(projectDir, stageNumber) {
  const prefix = `STAGE_${String(stageNumber).padStart(2, '0')}_`;
  if (!existsSync(projectDir)) return null;
  const files = readdirSync(projectDir).filter(
    f => f.startsWith(prefix) && f.endsWith('.md')
  );
  if (files.length === 0) return null;
  try {
    return readFileSync(path.join(projectDir, files[0]), 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build the artifacts object consumed by each rule.
 *
 * @param {string} projectDir
 * @returns {{ stage1: string|null, ..., stage8: string|null }}
 */
function buildArtifacts(projectDir) {
  const artifacts = {};
  for (let i = 1; i <= 8; i++) {
    artifacts[`stage${i}`] = loadStageContent(projectDir, i);
  }
  return artifacts;
}

/**
 * Run all cross-stage validation rules against a project's deliverables.
 *
 * @param {string} projectId
 * @param {{ projectDir?: string }} [options]
 * @returns {Promise<ValidationReport>}
 */
export async function validateProject(projectId, options = {}) {
  const projectDir = options.projectDir || getProjectDir(projectId);
  const artifacts = buildArtifacts(projectDir);

  const allFindings = [];

  for (const rule of ALL_RULES) {
    try {
      const findings = rule.check(artifacts);
      allFindings.push(...findings);
    } catch (err) {
      allFindings.push({
        ruleId: rule.ruleId,
        severity: 'error',
        message: `Rule execution failed: ${err.message}`,
        stagesInvolved: [],
        remediation: 'Check rule implementation and deliverable format.',
      });
    }
  }

  const errors = allFindings.filter(f => f.severity === 'error').length;
  const warnings = allFindings.filter(f => f.severity === 'warning').length;
  const infos = allFindings.filter(f => f.severity === 'info').length;
  const passed = ALL_RULES.length - new Set(allFindings.filter(f => f.severity === 'error').map(f => f.ruleId)).size;

  /** @type {ValidationReport} */
  const report = {
    projectId,
    timestamp: new Date().toISOString(),
    rulesRun: ALL_RULES.length,
    passed,
    failed: errors,
    warnings,
    findings: allFindings,
  };

  return report;
}
