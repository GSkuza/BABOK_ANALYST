/**
 * Rule INTEGRATION-COVERAGE
 *
 * Checks that the systems listed in the Stage 2 System Inventory are mentioned
 * in the Stage 5 Integration Points section.
 */

function extractSystemInventory(content) {
  // Look for System Inventory section and extract proper-noun words (system names)
  const match = content.match(/#+\s+System\s+Inventor[^]*?(?=\n#+\s|$)/i);
  if (!match) return [];
  const section = match[0];
  // Extract capitalised words (likely system/product names), min 3 chars
  return [...section.matchAll(/\b([A-Z][a-zA-Z0-9]{2,})\b/g)]
    .map(m => m[1])
    .filter(w => !['The', 'And', 'For', 'With', 'From', 'This', 'That', 'Has', 'Are', 'Not', 'All'].includes(w));
}

function extractIntegrationSection(content) {
  const match = content.match(/#+\s+Integration\s+Point[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : '';
}

/** Role → default BABOK stage number; a profile may rebind these. */
export const DEFAULT_BINDINGS = { as_is: 2, to_be: 5 };

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @param {{ as_is?: number, to_be?: number }} [bindings]
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts, bindings = DEFAULT_BINDINGS) {
  const b = { ...DEFAULT_BINDINGS, ...bindings };
  const stage2 = artifacts[`stage${b.as_is}`];
  const stage5 = artifacts[`stage${b.to_be}`];

  if (!stage2 || !stage5) return [];

  const systems = [...new Set(extractSystemInventory(stage2))];
  if (systems.length === 0) return [];

  const integrationSection = extractIntegrationSection(stage5);
  if (!integrationSection) {
    return [
      {
        ruleId: 'INTEGRATION-COVERAGE',
        severity: 'warning',
        message: `Stage ${b.to_be} is missing an Integration Points section`,
        stagesInvolved: [b.as_is, b.to_be],
        remediation: `Add an "Integration Points" section to Stage ${b.to_be} covering all systems from Stage ${b.as_is}`,
      },
    ];
  }

  const integrationLower = integrationSection.toLowerCase();
  const missing = systems.filter(s => !integrationLower.includes(s.toLowerCase()));

  if (missing.length > 0 && missing.length <= systems.length / 2) {
    return [
      {
        ruleId: 'INTEGRATION-COVERAGE',
        severity: 'warning',
        message: `Stage ${b.to_be} Integration Points may not cover all systems from Stage ${b.as_is} inventory. Possibly missing: ${missing.slice(0, 5).join(', ')}`,
        stagesInvolved: [b.as_is, b.to_be],
        remediation: `Ensure every system in the Stage ${b.as_is} inventory has a corresponding entry in Stage ${b.to_be} Integration Points`,
      },
    ];
  }

  return [];
}
