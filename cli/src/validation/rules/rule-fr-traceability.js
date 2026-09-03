/**
 * Rule FR-001: FR Traceability
 *
 * Checks that Stage 4 Functional Requirements IDs (FR-NNN) all appear in the
 * Requirements Traceability Matrix (RTM) section of the same document.
 */

/**
 * Split a markdown document into named sections (heading → content until next heading).
 * Returns a Map<headingTextLower, sectionContent>.
 */
function splitSections(content) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const sections = new Map();
  const lines = normalized.split('\n');
  let currentKey = '__preamble__';
  let currentLines = [];

  for (const line of lines) {
    const m = line.match(/^(#{1,6})\s+(.+)$/);
    if (m) {
      if (currentLines.length > 0) sections.set(currentKey, currentLines.join('\n'));
      currentKey = m[2].trim().toLowerCase();
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.length > 0) sections.set(currentKey, currentLines.join('\n'));
  return sections;
}

/** Role → default BABOK stage number; a profile may rebind these. */
export const DEFAULT_BINDINGS = { requirements: 4 };

/**
 * @param {{ [key: string]: string|null }} artifacts - keyed stageN
 * @param {{ requirements?: number }} [bindings]
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts, bindings = DEFAULT_BINDINGS) {
  const b = { ...DEFAULT_BINDINGS, ...bindings };
  const content = artifacts[`stage${b.requirements}`];
  if (!content) return [];

  const findings = [];

  // Find the RTM section key and the FR section key
  const sections = splitSections(content);

  // Find RTM section
  const rtmKey = [...sections.keys()].find(
    k => k.includes('traceability') || k.includes('rtm')
  );
  const rtmSection = rtmKey ? sections.get(rtmKey) : null;

  // Collect FR-NNN IDs from all non-RTM sections
  const nonRtmContent = [...sections.entries()]
    .filter(([k]) => k !== rtmKey)
    .map(([, v]) => v)
    .join('\n');

  const frIds = [...nonRtmContent.matchAll(/\bFR-\d{3,}\b/g)].map(m => m[0]);
  const uniqueFrIds = [...new Set(frIds)];

  if (uniqueFrIds.length === 0) {
    findings.push({
      ruleId: 'FR-TRACEABILITY',
      severity: 'error',
      message: `Stage ${b.requirements} has no Functional Requirements with FR-NNN identifiers`,
      stagesInvolved: [b.requirements],
      remediation: 'Define functional requirements using FR-001, FR-002, … identifiers',
    });
    return findings;
  }

  if (!rtmSection) {
    findings.push({
      ruleId: 'FR-TRACEABILITY',
      severity: 'error',
      message: `Stage ${b.requirements} is missing a Requirements Traceability Matrix (RTM) section`,
      stagesInvolved: [b.requirements],
      remediation: 'Add a "Requirements Traceability Matrix" section that references all FR-NNN identifiers',
    });
    return findings;
  }

  const rtmIds = new Set([...rtmSection.matchAll(/\bFR-\d{3,}\b/g)].map(m => m[0]));
  const missing = uniqueFrIds.filter(id => !rtmIds.has(id));

  if (missing.length > 0) {
    findings.push({
      ruleId: 'FR-TRACEABILITY',
      severity: 'error',
      message: `RTM is missing entries for: ${missing.join(', ')}`,
      stagesInvolved: [4],
      remediation: 'Add rows to the RTM for each missing FR identifier',
    });
  }

  return findings;
}
