/**
 * Barrel file — exports all validation rule check functions indexed by ruleId.
 */

export { check as checkFrTraceability } from './rule-fr-traceability.js';
export { check as checkBudgetCeiling } from './rule-budget-ceiling.js';
export { check as checkIntegrationCoverage } from './rule-integration-coverage.js';
export { check as checkKpiCoverage } from './rule-kpi-coverage.js';
export { check as checkCriticalRiskOwner } from './rule-critical-risk-owner.js';
export { check as checkRoadmapDate } from './rule-roadmap-date.js';
export { check as checkRecommendationTraceability } from './rule-recommendation-traceability.js';

import { check as frTraceability } from './rule-fr-traceability.js';
import { check as budgetCeiling } from './rule-budget-ceiling.js';
import { check as integrationCoverage } from './rule-integration-coverage.js';
import { check as kpiCoverage } from './rule-kpi-coverage.js';
import { check as criticalRiskOwner } from './rule-critical-risk-owner.js';
import { check as roadmapDate } from './rule-roadmap-date.js';
import { check as recommendationTraceability } from './rule-recommendation-traceability.js';

/**
 * Every known rule, keyed by ruleId. Profiles select from this registry and
 * supply stage bindings (see profiles/<id>/profile.json → validation.rules).
 */
export const RULE_REGISTRY = {
  'FR-TRACEABILITY':             frTraceability,
  'BUDGET-CEILING':              budgetCeiling,
  'INTEGRATION-COVERAGE':        integrationCoverage,
  'KPI-COVERAGE':                kpiCoverage,
  'CRITICAL-RISK-OWNER':         criticalRiskOwner,
  'ROADMAP-DATE':                roadmapDate,
  'RECOMMENDATION-TRACEABILITY': recommendationTraceability,
};

/**
 * Rules active for a profile, with bindings applied.
 * @param {{ validation: { rules: Array<{ id: string, bindings?: object }> } }} profile
 * @returns {Array<{ ruleId: string, check: (artifacts: object) => object[] }>}
 */
export function rulesForProfile(profile) {
  return profile.validation.rules.map(({ id, bindings }) => {
    const fn = RULE_REGISTRY[id];
    if (!fn) throw new Error(`Unknown validation rule "${id}" in profile ${profile.id}`);
    return { ruleId: id, check: (artifacts) => fn(artifacts, bindings) };
  });
}

/**
 * Default (BABOK) rule set with default bindings — kept for backward compatibility.
 * Each entry: { ruleId, check }
 */
export const ALL_RULES = [
  { ruleId: 'FR-TRACEABILITY',       check: frTraceability },
  { ruleId: 'BUDGET-CEILING',        check: budgetCeiling },
  { ruleId: 'INTEGRATION-COVERAGE',  check: integrationCoverage },
  { ruleId: 'KPI-COVERAGE',          check: kpiCoverage },
  { ruleId: 'CRITICAL-RISK-OWNER',   check: criticalRiskOwner },
  { ruleId: 'ROADMAP-DATE',          check: roadmapDate },
];
