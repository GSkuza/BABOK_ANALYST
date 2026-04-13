/**
 * Barrel file — exports all validation rule check functions indexed by ruleId.
 */

export { check as checkFrTraceability } from './rule-fr-traceability.js';
export { check as checkBudgetCeiling } from './rule-budget-ceiling.js';
export { check as checkIntegrationCoverage } from './rule-integration-coverage.js';
export { check as checkKpiCoverage } from './rule-kpi-coverage.js';
export { check as checkCriticalRiskOwner } from './rule-critical-risk-owner.js';
export { check as checkRoadmapDate } from './rule-roadmap-date.js';

import { check as frTraceability } from './rule-fr-traceability.js';
import { check as budgetCeiling } from './rule-budget-ceiling.js';
import { check as integrationCoverage } from './rule-integration-coverage.js';
import { check as kpiCoverage } from './rule-kpi-coverage.js';
import { check as criticalRiskOwner } from './rule-critical-risk-owner.js';
import { check as roadmapDate } from './rule-roadmap-date.js';

/**
 * All rules as an ordered array for use by the cross-stage validator.
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
