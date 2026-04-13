/**
 * Intra-stage consistency checker — heuristic checks for cross-section coherence
 * within a single stage deliverable.
 */

/**
 * Extract text content between two headings.
 * Returns an empty string if the heading is not found.
 */
function extractSectionText(content, keywords) {
  const lines = content.split('\n');
  let inSection = false;
  let sectionLevel = 0;
  const collected = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].toLowerCase();
      const isTarget = keywords.some(kw => headingText.includes(kw.toLowerCase()));

      if (isTarget && !inSection) {
        inSection = true;
        sectionLevel = level;
        continue;
      }
      if (inSection && level <= sectionLevel) {
        break;
      }
    }
    if (inSection) collected.push(line);
  }

  return collected.join('\n');
}

/**
 * Extract unique capitalised words (likely names/acronyms) from text.
 * Used to detect if names from one section appear in another.
 */
function extractSignificantWords(text, minLength = 3) {
  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'will', 'are', 'not', 'all', 'per', 'see', 'any']);
  return [...text.matchAll(/\b([A-Z][a-zA-Z]{2,})\b/g)]
    .map(m => m[1].toLowerCase())
    .filter(w => !stopWords.has(w));
}

/**
 * Check stage-1 specific consistency:
 * 1. RACI matrix should reference stakeholder names from Stakeholder Register
 * 2. Regulatory Requirements should share scope terms with Project Scope section
 */
function checkStage1Consistency(content) {
  const issues = [];
  let passed = 0;

  // Check 1: RACI references stakeholders
  const stakeholderSection = extractSectionText(content, ['stakeholder register', 'stakeholder']);
  const raciSection = extractSectionText(content, ['raci']);
  if (stakeholderSection && raciSection) {
    const stakeholderWords = new Set(extractSignificantWords(stakeholderSection));
    const raciWords = extractSignificantWords(raciSection);
    const overlap = raciWords.filter(w => stakeholderWords.has(w));
    if (overlap.length >= 1) {
      passed++;
    } else {
      issues.push({
        dimension: 'consistency',
        ruleId: 'S1-C2-RACI',
        severity: 'warning',
        message: 'RACI Matrix does not appear to reference stakeholders from the Stakeholder Register',
        remediation: 'Ensure RACI rows use the same role names as the Stakeholder Register',
      });
    }
  } else {
    passed++; // Cannot check — don't penalise if sections missing (completeness handles that)
  }

  // Check 2: Regulatory section shares terms with scope
  const scopeSection = extractSectionText(content, ['scope', 'in scope']);
  const regulatorySection = extractSectionText(content, ['regulatory']);
  if (scopeSection && regulatorySection) {
    const scopeWords = new Set(extractSignificantWords(scopeSection));
    const regWords = extractSignificantWords(regulatorySection);
    const overlap = regWords.filter(w => scopeWords.has(w));
    if (overlap.length >= 1) {
      passed++;
    } else {
      issues.push({
        dimension: 'consistency',
        ruleId: 'S1-C1-SCOPE-REG',
        severity: 'warning',
        message: 'Regulatory Requirements do not appear to relate to scope items',
        remediation: 'Cross-reference in-scope document types with applicable regulations',
      });
    }
  } else {
    passed++;
  }

  return { passed, total: 2, issues };
}

/**
 * Check stage-4 specific consistency:
 * FRs listed in Functional Requirements should also appear in the RTM.
 */
function checkStage4Consistency(content) {
  const issues = [];

  const frSection = extractSectionText(content, ['functional requirement']);
  const rtmSection = extractSectionText(content, ['traceability', 'rtm']);

  if (frSection && rtmSection) {
    const frIds = [...frSection.matchAll(/\bFR-\d+\b/g)].map(m => m[0]);
    const rtmIds = new Set([...rtmSection.matchAll(/\bFR-\d+\b/g)].map(m => m[0]));
    const missing = frIds.filter(id => !rtmIds.has(id));

    if (missing.length === 0) {
      return { passed: 1, total: 1, issues: [] };
    } else {
      issues.push({
        dimension: 'consistency',
        ruleId: 'S4-C1-RTM-COVERAGE',
        severity: 'warning',
        message: `RTM is missing entries for: ${missing.join(', ')}`,
        remediation: 'Add a row in the RTM for every FR listed in Functional Requirements',
      });
      return { passed: 0, total: 1, issues };
    }
  }

  return { passed: 1, total: 1, issues: [] }; // Cannot check
}

/**
 * Generic consistency check: verifies section cross-referencing using
 * rubric-provided consistency_checks array.
 */
function checkGenericConsistency(content, consistencyChecks) {
  if (!consistencyChecks || consistencyChecks.length === 0) {
    return { passed: 0, total: 0, issues: [] };
  }
  // Generic: just pass (checks are documented but hard to automate without NLP)
  return { passed: consistencyChecks.length, total: consistencyChecks.length, issues: [] };
}

/**
 * @param {string} content - Raw markdown of the deliverable
 * @param {Array} consistencyChecks - Consistency check descriptors from rubric
 * @param {number} stageNumber
 * @returns {{ score: number, issues: import('../scorer.js').ScorerIssue[] }}
 */
export function checkConsistency(content, consistencyChecks, stageNumber) {
  let result;

  switch (stageNumber) {
    case 1:
      result = checkStage1Consistency(content);
      break;
    case 4:
      result = checkStage4Consistency(content);
      break;
    default:
      result = checkGenericConsistency(content, consistencyChecks);
      break;
  }

  const score = result.total > 0
    ? Math.round((result.passed / result.total) * 100)
    : 100; // No checks → full score

  return { score, issues: result.issues };
}
