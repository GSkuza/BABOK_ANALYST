/**
 * Rule CRITICAL-RISK-OWNER
 *
 * Checks that every Critical or High risk in Stage 7 Risk Register has a named
 * owner and a target mitigation date.
 */

// Matches rows that start with | and contain "critical" or "high" (case-insensitive)
const RISK_ROW_RE = /\|[^|\n]*\|[^|\n]*(?:critical|high)[^|\n]*\|[^|\n]*\|[^|\n]*\|[^|\n]*/gi;
// Minimal date-like pattern
const DATE_RE = /\b\d{4}-\d{2}-\d{2}\b|\b\d{2}[./]\d{2}[./]\d{4}\b|\bQ[1-4]\s+\d{4}\b/i;
// Owner name pattern: capitalised word sequence (First Last) or specific labels
const OWNER_RE = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b|owner|responsible|assigned to/i;

function extractRiskRegisterSection(content) {
  const match = content.match(/#+\s+Risk\s+Register[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : null;
}

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts) {
  const stage7 = artifacts.stage7;
  if (!stage7) return [];

  const riskSection = extractRiskRegisterSection(stage7);
  if (!riskSection) {
    return [
      {
        ruleId: 'CRITICAL-RISK-OWNER',
        severity: 'warning',
        message: 'Stage 7 has no Risk Register section',
        stagesInvolved: [7],
        remediation: 'Add a "Risk Register" section with rows for each identified risk',
      },
    ];
  }

  const highRiskRows = [...riskSection.matchAll(RISK_ROW_RE)].map(m => m[0]);
  if (highRiskRows.length === 0) return []; // No critical/high risks found — passes

  const missingOwner = [];
  const missingDate = [];

  for (const row of highRiskRows) {
    if (!OWNER_RE.test(row)) missingOwner.push(row.slice(0, 60).trim());
    if (!DATE_RE.test(row)) missingDate.push(row.slice(0, 60).trim());
  }

  const findings = [];

  if (missingOwner.length > 0) {
    findings.push({
      ruleId: 'CRITICAL-RISK-OWNER',
      severity: 'error',
      message: `${missingOwner.length} Critical/High risk(s) in Stage 7 are missing an assigned owner`,
      stagesInvolved: [7],
      remediation: 'Assign a named owner to every Critical or High risk in the Risk Register',
    });
  }

  if (missingDate.length > 0) {
    findings.push({
      ruleId: 'CRITICAL-RISK-OWNER',
      severity: 'warning',
      message: `${missingDate.length} Critical/High risk(s) in Stage 7 are missing a target mitigation date`,
      stagesInvolved: [7],
      remediation: 'Add a specific mitigation target date to every Critical or High risk row',
    });
  }

  return findings;
}
