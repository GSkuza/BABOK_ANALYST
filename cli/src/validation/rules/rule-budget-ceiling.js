/**
 * Rule BUDGET-CEILING
 *
 * Checks that the cost figures mentioned in Stage 8 (Business Case) do not
 * contradict the budget range stated in Stage 1 (Project Initialization).
 *
 * Heuristic: extracts the first numeric value in Stage 1 budget section and
 * the first implementation cost in Stage 8, then flags if Stage 8 cost is
 * clearly higher (> 2x the Stage 1 upper bound).
 */

const CURRENCY_NUM_RE = /[€$£]?\s*(\d[\d,. ]*\d|\d)\s*(?:k|K|thousand|million|M)?/g;

function extractNumbers(text) {
  const nums = [];
  for (const m of text.matchAll(CURRENCY_NUM_RE)) {
    const raw = m[1].replace(/[, ]/g, '');
    const val = parseFloat(raw);
    if (!isNaN(val) && val > 0) nums.push(val);
  }
  return nums;
}

function extractBudgetSection(content) {
  const match = content.match(/#+\s+(?:Project\s+Constraint|Budget)[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : null;
}

function extractCostSection(content) {
  const match = content.match(/#+\s+(?:Implementation\s+Cost|Cost.Benefit|CBA)[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : '';
}

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts) {
  const stage1 = artifacts.stage1;
  const stage8 = artifacts.stage8;

  if (!stage1 || !stage8) return []; // Cannot check if either stage is absent

  const budgetSection = extractBudgetSection(stage1);
  if (!budgetSection) return []; // No budget section found — skip

  const budgetNums = extractNumbers(budgetSection);
  if (budgetNums.length === 0) return []; // No numeric budget data

  // Use the largest number in the budget section as the ceiling
  const budgetCeiling = Math.max(...budgetNums);

  const costSection = extractCostSection(stage8);
  const costNums = extractNumbers(costSection);
  if (costNums.length === 0) return [];

  const maxCost = Math.max(...costNums);

  // Flag if Stage 8 costs exceed Stage 1 budget ceiling by more than 50%
  if (maxCost > budgetCeiling * 1.5) {
    return [
      {
        ruleId: 'BUDGET-CEILING',
        severity: 'warning',
        message: `Stage 8 cost figure (${maxCost.toLocaleString()}) exceeds Stage 1 budget ceiling (${budgetCeiling.toLocaleString()}) by more than 50%`,
        stagesInvolved: [1, 8],
        remediation: 'Reconcile the project budget in Stage 1 with the cost estimates in Stage 8',
      },
    ];
  }

  return [];
}
