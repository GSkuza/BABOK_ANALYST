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
import { getProjectProfile } from '../journal.js';
import { DEFAULT_PROFILE_ID, loadProfile } from '../profiles.js';
import { rulesForProfile } from './rules/index.js';

/**
 * Profile for validation: explicit option → project journal → default.
 * @param {string} projectId
 * @param {{ profile?: string|object }} options
 */
function resolveProfile(projectId, options) {
  if (options.profile) {
    return typeof options.profile === 'string' ? loadProfile(options.profile) : options.profile;
  }
  try {
    return getProjectProfile(projectId);
  } catch {
    return loadProfile(DEFAULT_PROFILE_ID);
  }
}

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
 * Build the artifacts object consumed by each rule, keyed stage<N> for every
 * stage of the profile (stage 0 included; rules pick what they need).
 *
 * @param {string} projectDir
 * @param {object} profile
 * @returns {{ [key: string]: string|null }}
 */
function buildArtifacts(projectDir, profile) {
  const artifacts = {};
  for (const s of profile.stages) {
    artifacts[`stage${s.stage}`] = loadStageContent(projectDir, s.stage);
  }
  return artifacts;
}

/**
 * Run the profile's cross-stage validation rules against a project's deliverables.
 *
 * @param {string} projectId
 * @param {{ projectDir?: string, profile?: string|object }} [options]
 * @returns {Promise<ValidationReport>}
 */
export async function validateProject(projectId, options = {}) {
  const projectDir = options.projectDir || getProjectDir(projectId);
  const profile = resolveProfile(projectId, options);
  const rules = rulesForProfile(profile);
  const artifacts = buildArtifacts(projectDir, profile);

  const allFindings = [];

  for (const rule of rules) {
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
  const passed = rules.length - new Set(allFindings.filter(f => f.severity === 'error').map(f => f.ruleId)).size;

  /** @type {ValidationReport} */
  const report = {
    projectId,
    timestamp: new Date().toISOString(),
    rulesRun: rules.length,
    passed,
    failed: errors,
    warnings,
    findings: allFindings,
  };

  return report;
}
