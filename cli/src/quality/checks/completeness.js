/**
 * Completeness checker — verifies that all required sections from the rubric
 * are present as headings in the markdown deliverable.
 */

/**
 * Extract all headings (any level) from markdown content.
 * @param {string} content
 * @returns {string[]} heading texts in lower-case
 */
function extractHeadings(content) {
  const headings = [];
  const re = /^#{1,6}\s+(.+)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    headings.push(m[1].trim().toLowerCase());
  }
  return headings;
}

/**
 * Build keyword tokens for matching against headings.
 * For "A — B" sections, returns tokens from both parts.
 */
function sectionTokens(sectionName) {
  const parts = sectionName.split('—').map(p => p.trim());
  // Use the last (most specific) part as the primary key
  return parts.map(p => p.toLowerCase());
}

/**
 * Check if any heading satisfies the section requirement.
 */
function sectionPresent(headings, sectionName) {
  const tokens = sectionTokens(sectionName);
  // Also check the full section name collapsed
  const fullLower = sectionName.toLowerCase();

  return headings.some(h => {
    if (h.includes(fullLower)) return true;
    // Check each token (sub-part) — if heading contains the most-specific sub-part it qualifies
    return tokens.some(tok => tok.length >= 3 && h.includes(tok));
  });
}

/**
 * @param {string} content - Raw markdown of the deliverable
 * @param {string[]} requiredSections - Section names from rubric
 * @returns {{ score: number, issues: import('../scorer.js').ScorerIssue[] }}
 */
export function checkCompleteness(content, requiredSections) {
  if (!requiredSections || requiredSections.length === 0) {
    return { score: 100, issues: [] };
  }

  const headings = extractHeadings(content);
  const issues = [];
  let found = 0;

  for (const section of requiredSections) {
    if (sectionPresent(headings, section)) {
      found++;
    } else {
      const ruleId = `COMP-${section.replace(/[^A-Z0-9]/gi, '_').toUpperCase().slice(0, 40)}`;
      issues.push({
        dimension: 'completeness',
        ruleId,
        severity: 'error',
        message: `Required section "${section}" is missing or has no matching heading`,
        remediation: `Add a heading that clearly references "${section}"`,
      });
    }
  }

  const score = Math.round((found / requiredSections.length) * 100);
  return { score, issues };
}
