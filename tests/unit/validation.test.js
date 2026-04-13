/**
 * Unit tests for cross-stage validation rules
 * Uses Node.js native test runner (node:test)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { check as frTraceability } from '../../cli/src/validation/rules/rule-fr-traceability.js';
import { check as budgetCeiling } from '../../cli/src/validation/rules/rule-budget-ceiling.js';
import { check as integrationCoverage } from '../../cli/src/validation/rules/rule-integration-coverage.js';
import { check as kpiCoverage } from '../../cli/src/validation/rules/rule-kpi-coverage.js';
import { check as criticalRiskOwner } from '../../cli/src/validation/rules/rule-critical-risk-owner.js';
import { check as roadmapDate } from '../../cli/src/validation/rules/rule-roadmap-date.js';
import { validateProject } from '../../cli/src/validation/cross-stage-validator.js';
import { createTempProject, copyFixtureToProject } from '../helpers/temp-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf-8');
}

// ─── rule-fr-traceability ───────────────────────────────────────────────────

describe('rule-fr-traceability', () => {
  test('passes with valid_stage4 (FR-001, FR-002 in RTM)', () => {
    const stage4 = readFixture('valid_stage4.md');
    const findings = frTraceability({ stage4 });
    assert.equal(findings.length, 0, `Expected no findings, got: ${JSON.stringify(findings)}`);
  });

  test('fails with invalid_stage4_no_traceability (no RTM section)', () => {
    const stage4 = readFixture('invalid_stage4_no_traceability.md');
    const findings = frTraceability({ stage4 });
    assert.ok(findings.length > 0, 'Should report an error for missing RTM');
    assert.equal(findings[0].ruleId, 'FR-TRACEABILITY');
    assert.equal(findings[0].severity, 'error');
  });

  test('returns empty array when stage4 is null', () => {
    const findings = frTraceability({ stage4: null });
    assert.deepEqual(findings, []);
  });

  test('fails when FRs exist but RTM is missing their IDs', () => {
    const content = `## Functional Requirements (FR-NNN)\n\n### FR-001: Something\n\n### FR-002: Another\n\n## Requirements Traceability Matrix (RTM)\n\n| FR-001 | desc |\n`;
    const findings = frTraceability({ stage4: content });
    // FR-002 is missing from RTM — should report
    assert.ok(findings.length > 0, 'Should report FR-002 missing from RTM');
  });
});

// ─── rule-budget-ceiling ────────────────────────────────────────────────────

describe('rule-budget-ceiling', () => {
  test('returns empty array when either stage is null', () => {
    assert.deepEqual(budgetCeiling({ stage1: null, stage8: null }), []);
    assert.deepEqual(budgetCeiling({ stage1: 'some content', stage8: null }), []);
  });

  test('does not flag when Stage 8 cost is within Stage 1 budget', () => {
    const stage1 = `## Project Constraints\n\nBudget: €30,000 – €60,000\n`;
    const stage8 = `## Implementation Cost Breakdown\n\nTotal cost: €45,000\n`;
    const findings = budgetCeiling({ stage1, stage8 });
    assert.equal(findings.length, 0, 'Should not flag when cost is within budget');
  });

  test('flags when Stage 8 cost greatly exceeds Stage 1 ceiling', () => {
    const stage1 = `## Project Constraints\n\nBudget: €20,000\n`;
    const stage8 = `## Implementation Cost Breakdown\n\nTotal implementation cost: €150,000\n`;
    const findings = budgetCeiling({ stage1, stage8 });
    assert.ok(findings.length > 0, 'Should flag cost overrun');
    assert.equal(findings[0].ruleId, 'BUDGET-CEILING');
  });
});

// ─── rule-kpi-coverage ──────────────────────────────────────────────────────

describe('rule-kpi-coverage', () => {
  test('returns empty when both stages are null', () => {
    assert.deepEqual(kpiCoverage({ stage1: null, stage2: null }), []);
  });

  test('warns when Stage 2 has no Baseline Metrics section', () => {
    const stage1 = `## Success Criteria\n\nInvoice processing time: 45 minutes\nApproval cycle: 5 days\n`;
    const stage2 = `## Pain Points Analysis\n\nManual data entry is error-prone.\n`;
    const findings = kpiCoverage({ stage1, stage2 });
    assert.ok(findings.length > 0, 'Should warn about missing baseline metrics');
  });

  test('passes when Stage 2 covers KPI terms from Stage 1', () => {
    const stage1 = `## Success Criteria\n\nInvoice processing time baseline: 45 minutes\n`;
    const stage2 = `## Baseline Metrics\n\nInvoice processing time: currently 45 minutes per invoice.\n`;
    const findings = kpiCoverage({ stage1, stage2 });
    assert.equal(findings.length, 0, 'Should pass when KPIs are covered');
  });
});

// ─── rule-critical-risk-owner ───────────────────────────────────────────────

describe('rule-critical-risk-owner', () => {
  test('returns empty when stage7 is null', () => {
    assert.deepEqual(criticalRiskOwner({ stage7: null }), []);
  });

  test('passes when critical risks have named owners', () => {
    const stage7 = `## Risk Register\n\n| R-001 | Data breach | CRITICAL | John Smith | 2025-12-01 |\n| R-002 | Delay | HIGH | Jane Doe | 2025-11-01 |\n`;
    const findings = criticalRiskOwner({ stage7 });
    // Named owners present: John Smith, Jane Doe
    assert.ok(findings.filter(f => f.severity === 'error').length === 0, 'Should not flag error when owners are present');
  });

  test('flags critical risks without owner names', () => {
    const stage7 = `## Risk Register\n\n| R-001 | Data breach | CRITICAL | TBD | TBD |\n`;
    const findings = criticalRiskOwner({ stage7 });
    assert.ok(findings.length > 0, 'Should flag missing owner');
  });
});

// ─── rule-roadmap-date ──────────────────────────────────────────────────────

describe('rule-roadmap-date', () => {
  test('returns empty when either stage is null', () => {
    assert.deepEqual(roadmapDate({ stage1: null, stage6: null }), []);
  });

  test('passes when Stage 6 date matches Stage 1 target', () => {
    const stage1 = `## Project Constraints\n\nTarget go-live: 2025-12-01\n`;
    const stage6 = `## Key Milestones\n\nProject completion: 2025-12-15\n`;
    const findings = roadmapDate({ stage1, stage6 });
    // 2025-12-15 is within 3 months of 2025-12-01
    assert.equal(findings.length, 0, 'Should pass when dates are aligned');
  });

  test('warns when Stage 6 date is more than 3 months after Stage 1 target', () => {
    const stage1 = `## Project Constraints\n\nTarget go-live: 2025-06-01\n`;
    const stage6 = `## Key Milestones\n\nProject completion: 2026-03-01\n`;
    const findings = roadmapDate({ stage1, stage6 });
    assert.ok(findings.length > 0, 'Should warn about date inconsistency');
    assert.equal(findings[0].ruleId, 'ROADMAP-DATE');
  });
});

// ─── validateProject ────────────────────────────────────────────────────────

describe('validateProject', () => {
  test('returns a ValidationReport with correct structure', async () => {
    const tmp = createTempProject('BABOK-TEST-VALIDATE');
    try {
      const report = await validateProject('BABOK-TEST-VALIDATE', { projectDir: tmp.projectDir });
      assert.ok(report.projectId, 'Should have projectId');
      assert.ok(report.timestamp, 'Should have timestamp');
      assert.equal(typeof report.rulesRun, 'number');
      assert.ok(report.rulesRun > 0, 'Should have run some rules');
      assert.ok(Array.isArray(report.findings), 'findings should be array');
    } finally {
      tmp.cleanup();
    }
  });

  test('does not throw when all stages are missing (graceful null handling)', async () => {
    const tmp = createTempProject('BABOK-TEST-EMPTY-V');
    try {
      await assert.doesNotReject(
        () => validateProject('BABOK-TEST-EMPTY-V', { projectDir: tmp.projectDir })
      );
    } finally {
      tmp.cleanup();
    }
  });
});
