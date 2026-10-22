/**
 * SMART / Quality checker - heuristic checks for measurability, specificity,
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
 * Remove markdown table header rows, separator rows, unfilled template placeholders,
 * prompt labels, and markdown headings so only substantive filled-in content is evaluated.
 */
function cleanContent(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const separatorRe = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/;
  const filtered = [];

  for (let i = 0; i < lines.length; i++) {
    // If the next line is a table separator, this line is a table header row -> skip both
    if (i + 1 < lines.length && separatorRe.test(lines[i + 1])) {
      i++;
      continue;
    }
    if (separatorRe.test(lines[i])) {
      continue;
    }

    // Skip section headings
    if (/^#{1,6}\s+/.test(lines[i])) {
      continue;
    }

    // Skip horizontal rules/dividers
    if (/^\s*---+\s*$/.test(lines[i])) {
      continue;
    }

    // Skip HTML comments
    if (/<!--[\s\S]*?-->/.test(lines[i])) {
      continue;
    }

    // Skip lines that still contain unfilled template placeholders
    // (placeholders are [...] but not checkboxes [ ], [x], [X] and not markdown links [...](...))
    if (/\[(?![ xX]\])[^\]\r\n]+\](?!\()/.test(lines[i])) {
      continue;
    }

    // Strip [placeholders] not followed by (
    let line = lines[i].replace(/\[[^\]\r\n]*\](?!\()/g, '');

    // Skip empty bullet points or prompt labels like "**5 Whys:**"
    if (/^\s*(?:[-*]|\d+[.)])\s*$/.test(line)) {
      continue;
    }
    if (/^\s*\*\*[^*]+\*\*:\s*$/.test(line)) {
      continue;
    }

    // If line is a markdown table row, verify that data cells are not empty
    if (line.includes('|')) {
      const parts = line.split('|').map(s => s.trim());
      const cells = parts.filter((_, idx, arr) => {
        if (idx === 0 && parts[0] === '') return false;
        if (idx === arr.length - 1 && parts[arr.length - 1] === '') return false;
        return true;
      });
      // In a markdown table row, if all data cells after cell 0 are empty,
      // it means only the template key/label remains without any filled value
      if (cells.length > 1) {
        const dataCells = cells.slice(1);
        if (dataCells.every(c => c.length === 0)) {
          continue; // skip unfilled prompt row
        }
      } else if (cells.length === 1 && cells[0].length === 0) {
        continue;
      }
    }

    if (line.trim().length === 0) {
      continue;
    }

    filtered.push(line);
  }

  return filtered.join('\n');
}

/**
 * Extract content of a section identified by heading keywords.
 * Returns the text between that heading and the next same-or-higher-level heading.
 */
function extractSection(content, keywords) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
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

  // Informational notice if header placeholders remain (does not fail scoring)
  if (/\[(?:Project Name|Project ID|Initiative ID|Engagement ID|BABOK-YYYYMMDD|BC-YYYYMMDD|SD-YYYYMMDD|YYYY-MM-DD)\]/i.test(content)) {
    issues.push({
      dimension: 'quality',
      ruleId: 'HDR-PLACEHOLDER',
      severity: 'info',
      message: 'Document contains unfilled header placeholder tokens',
      remediation: 'Fill in project metadata (Project Name, ID, Date) in deliverable header',
    });
  }

  for (const criterion of criteria) {
    const { id, description, applies_to, smart_dimension } = criterion;
    let section = '';
    if (applies_to) {
      const rawSection = extractSection(content, [applies_to]);
      if (!rawSection || rawSection.trim().length === 0) {
        issues.push({
          dimension: 'quality',
          ruleId: id,
          severity: 'warning',
          message: `Quality criterion not met: missing section "${applies_to}" (${description})`,
          remediation: `Add section "${applies_to}" and ensure it satisfies (${description})`,
        });
        continue;
      }
      section = rawSection;
    } else {
      section = content;
    }

    if (criterion.manual_review || smart_dimension === 'manual_review') {
      issues.push({
        dimension: 'quality',
        ruleId: id,
        severity: 'info',
        message: `Manual review required: ${description}`,
        remediation: `Verify manually during human attestation: ensure "${applies_to}" satisfies (${description})`,
      });
      passed++;
      continue;
    }

    const text = cleanContent(section);
    let ok = false;
    const lowerDesc = description.toLowerCase();

    // If cleaned section is empty, quality criterion cannot be met
    if (text.trim().length === 0) {
      issues.push({
        dimension: 'quality',
        ruleId: id,
        severity: 'warning',
        message: `Quality criterion not met: section "${applies_to || 'deliverable'}" contains no substantive filled data (${description})`,
        remediation: `Ensure "${applies_to || 'deliverable'}" is populated with substantive data`,
      });
      continue;
    }

    if (criterion.pattern) {
      const patRe = new RegExp(criterion.pattern, 'i');
      ok = patRe.test(text);
    } else if (criterion.signals && Array.isArray(criterion.signals) && criterion.signals.length > 0) {
      const lowerText = text.toLowerCase();
      ok = criterion.signals.some(sig => lowerText.includes(sig.toLowerCase()));
    } else if (smart_dimension === 'Measurable' || lowerDesc.includes('numeric')) {
      // Require at least one numeric value
      ok = NUM_RE.test(text);
      NUM_RE.lastIndex = 0;
    } else if (smart_dimension === 'Time-bound' || lowerDesc.includes('date') || lowerDesc.includes('deadline')) {
      // Require a specific date pattern
      ok = DATE_RE.test(text);
      DATE_RE.lastIndex = 0;
    } else if (lowerDesc.includes('currency')) {
      // Require a currency symbol + number
      ok = CURRENCY_SYMBOL_RE.test(text) && NUM_RE.test(text);
      NUM_RE.lastIndex = 0;
    } else if (smart_dimension === 'Specific') {
      ok = text.trim().length > 0 && (NUM_RE.test(text) || /[a-zA-Z]{3,}/.test(text));
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
