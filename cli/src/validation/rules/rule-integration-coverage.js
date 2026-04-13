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

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts) {
  const stage2 = artifacts.stage2;
  const stage5 = artifacts.stage5;

  if (!stage2 || !stage5) return [];

  const systems = [...new Set(extractSystemInventory(stage2))];
  if (systems.length === 0) return [];

  const integrationSection = extractIntegrationSection(stage5);
  if (!integrationSection) {
    return [
      {
        ruleId: 'INTEGRATION-COVERAGE',
        severity: 'warning',
        message: 'Stage 5 is missing an Integration Points section',
        stagesInvolved: [2, 5],
        remediation: 'Add an "Integration Points" section to Stage 5 covering all systems from Stage 2',
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
        message: `Stage 5 Integration Points may not cover all systems from Stage 2 inventory. Possibly missing: ${missing.slice(0, 5).join(', ')}`,
        stagesInvolved: [2, 5],
        remediation: 'Ensure every system in the Stage 2 inventory has a corresponding entry in Stage 5 Integration Points',
      },
    ];
  }

  return [];
}
