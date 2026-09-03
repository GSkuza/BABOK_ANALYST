/**
 * Rule KPI-COVERAGE
 *
 * Checks that the KPIs mentioned in Stage 1 Success Criteria section
 * are represented with baseline metric data in Stage 2 Baseline Metrics section.
 */

/** Minimum fraction of Stage 1 KPI terms that must appear in Stage 2 baseline. */
const MIN_KPI_COVERAGE_RATIO = 0.5;

const KPI_DIMENSION_KEYWORDS = [
  'processing time', 'cycle time', 'throughput', 'error rate', 'cost', 'hours',
  'days', 'minutes', 'percentage', 'volume', 'count', 'number of', 'invoice',
  'approval', 'retrieval', 'storage', 'fte',
];

function extractKpiTerms(stage1Content) {
  const match = stage1Content.match(/#+\s+Success\s+Criteri[^]*?(?=\n#+\s|$)/i);
  const section = match ? match[0].toLowerCase() : stage1Content.toLowerCase();
  return KPI_DIMENSION_KEYWORDS.filter(kw => section.includes(kw));
}

function extractBaselineMetricsSection(stage2Content) {
  const match = stage2Content.match(/#+\s+Baseline\s+Metric[^]*?(?=\n#+\s|$)/i);
  return match ? match[0].toLowerCase() : '';
}

/** Role → default BABOK stage number; a profile may rebind these. */
export const DEFAULT_BINDINGS = { charter: 1, as_is: 2 };

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @param {{ charter?: number, as_is?: number }} [bindings]
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts, bindings = DEFAULT_BINDINGS) {
  const b = { ...DEFAULT_BINDINGS, ...bindings };
  const stage1 = artifacts[`stage${b.charter}`];
  const stage2 = artifacts[`stage${b.as_is}`];

  if (!stage1 || !stage2) return [];

  const kpiTerms = extractKpiTerms(stage1);
  if (kpiTerms.length === 0) return [];

  const baselineSection = extractBaselineMetricsSection(stage2);
  if (!baselineSection) {
    return [
      {
        ruleId: 'KPI-COVERAGE',
        severity: 'warning',
        message: `Stage ${b.as_is} has no Baseline Metrics section`,
        stagesInvolved: [b.charter, b.as_is],
        remediation: `Add a "Baseline Metrics" section to Stage ${b.as_is} documenting current-state KPI values`,
      },
    ];
  }

  // Check that at least half the KPI terms from Stage 1 appear in Stage 2 baseline
  const covered = kpiTerms.filter(kw => baselineSection.includes(kw));
  const coverageRatio = covered.length / kpiTerms.length;

  if (coverageRatio < MIN_KPI_COVERAGE_RATIO) {
    const uncovered = kpiTerms.filter(kw => !baselineSection.includes(kw));
    return [
      {
        ruleId: 'KPI-COVERAGE',
        severity: 'warning',
        message: `Stage ${b.as_is} Baseline Metrics covers only ${Math.round(coverageRatio * 100)}% of the KPI dimensions set in Stage ${b.charter} Success Criteria. Missing: ${uncovered.slice(0, 4).join(', ')}`,
        stagesInvolved: [b.charter, b.as_is],
        remediation: `Ensure Stage ${b.as_is} Baseline Metrics includes numeric baselines for all KPI dimensions defined in Stage ${b.charter}`,
      },
    ];
  }

  return [];
}
