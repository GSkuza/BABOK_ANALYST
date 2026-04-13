/**
 * SMART / Quality checker — heuristic checks for measurability, specificity,
 * and time-bound attributes in stage deliverables.
 */

// Numeric value patterns (integers, decimals, percentages)
const NUM_RE = /\b\d+(?:[.,]\d+)?(?:\s*%)?/g;
// Currency patterns
const CURRENCY_RE = /[€$£]\s*\d[\d,.]*/g;
const CURRENCY_SYMBOL_RE = /[€$£]/;
// Date patterns: YYYY-MM-DD or DD.MM.YYYY or DD/MM/YYYY
const DATE_RE = /\b\d{4}-\d{2}-\d{2}\b|\b\d{2}[./]\d{2}[./]\d{4}\b/g;
// ROI-related keywords
const ROI_KEYWORDS_RE = /\b(npv|irr|payback|return on investment|roi)\b/gi;
// KPI-specific keywords that should accompany numeric values
const KPI_KEYWORDS_RE = /\b(baseline|target|current|reduction|improvement|hours?|days?|minutes?|months?|years?)\b/gi;

/**
 * Count non-overlapping regex matches in a string.
 */
function countMatches(text, re) {
  return (text.match(re) || []).length;
}

/**
 * Extract content of a section identified by heading keywords.
 * Returns the text between that heading and the next same-or-higher-level heading.
 */
function extractSection(content, keywords) {
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
        break; // Exit section when we hit an equal or higher-level heading
      }
    }
    if (inSection) collected.push(line);
  }

  return collected.join('\n');
}

/**
 * Evaluate quality criteria against markdown content.
 * Each criterion contributes equally to the quality score.
 *
 * @param {string} content
 * @param {Array<{id: string, description: string, applies_to: string, smart_dimension: string}>} criteria
 * @returns {{ score: number, issues: import('../scorer.js').ScorerIssue[] }}
 */
export function checkSmart(content, criteria) {
  if (!criteria || criteria.length === 0) {
    // No explicit criteria: do a generic quality check
    return genericQualityCheck(content);
  }

  const issues = [];
  let passed = 0;

  for (const criterion of criteria) {
    const { id, description, applies_to, smart_dimension } = criterion;
    const section = applies_to
      ? extractSection(content, [applies_to])
      : content;
    const text = section.length > 50 ? section : content; // fallback to full doc

    let ok = false;
    const lowerDesc = description.toLowerCase();

    if (smart_dimension === 'Measurable' || lowerDesc.includes('numeric')) {
      // Require at least one numeric value
      ok = NUM_RE.test(text);
      NUM_RE.lastIndex = 0;
    } else if (smart_dimension === 'Time-bound' || lowerDesc.includes('date') || lowerDesc.includes('deadline')) {
      // Require a specific date pattern
      ok = DATE_RE.test(text);
      DATE_RE.lastIndex = 0;
    } else if (smart_dimension === 'Specific' || lowerDesc.includes('currency')) {
      // Require a currency symbol + number
      ok = CURRENCY_SYMBOL_RE.test(text) && NUM_RE.test(text);
      NUM_RE.lastIndex = 0;
    } else if (lowerDesc.includes('npv') || lowerDesc.includes('irr') || lowerDesc.includes('payback')) {
      ok = ROI_KEYWORDS_RE.test(text);
      ROI_KEYWORDS_RE.lastIndex = 0;
    } else {
      // Generic: presence of numbers counts as quality
      ok = NUM_RE.test(text);
      NUM_RE.lastIndex = 0;
    }

    if (ok) {
      passed++;
    } else {
      issues.push({
        dimension: 'quality',
        ruleId: id,
        severity: 'warning',
        message: `Quality criterion not met: ${description}`,
        remediation: `Ensure "${applies_to}" section contains ${smart_dimension} data (${description})`,
      });
    }
  }

  const score = criteria.length > 0 ? Math.round((passed / criteria.length) * 100) : 100;
  return { score, issues };
}

/**
 * Generic quality check when no explicit criteria are provided.
 */
function genericQualityCheck(content) {
  const issues = [];
  let points = 0;
  const total = 4;

  // 1. Contains numeric values
  if (countMatches(content, /\b\d+(?:[.,]\d+)?/g) >= 3) points++;
  else issues.push({ dimension: 'quality', ruleId: 'GEN-Q1', severity: 'warning', message: 'Document lacks numeric values', remediation: 'Add quantitative data' });

  // 2. Contains dates
  if (DATE_RE.test(content)) { points++; DATE_RE.lastIndex = 0; }
  else issues.push({ dimension: 'quality', ruleId: 'GEN-Q2', severity: 'warning', message: 'No specific dates found', remediation: 'Add specific calendar dates' });

  // 3. Contains currency
  if (CURRENCY_SYMBOL_RE.test(content)) points++;
  else issues.push({ dimension: 'quality', ruleId: 'GEN-Q3', severity: 'info', message: 'No currency symbols found', remediation: 'Include monetary figures with currency symbols' });

  // 4. Contains KPI keywords
  if (KPI_KEYWORDS_RE.test(content)) { points++; KPI_KEYWORDS_RE.lastIndex = 0; }
  else issues.push({ dimension: 'quality', ruleId: 'GEN-Q4', severity: 'info', message: 'No KPI-related terminology found', remediation: 'Include baseline/target KPI language' });

  return { score: Math.round((points / total) * 100), issues };
}
