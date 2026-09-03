/**
 * Rule ROADMAP-DATE
 *
 * Checks that the completion/go-live date in Stage 6 (Gap Analysis & Roadmap)
 * does not contradict the target go-live date stated in Stage 1 Project Constraints.
 *
 * Heuristic: parse the earliest YYYY-MM-DD (or similar) date from Stage 1 timeline,
 * and the latest completion date from Stage 6 milestones. Warn if Stage 6 date
 * is more than 3 months later than Stage 1 target.
 */

// Match YYYY-MM-DD
const DATE_ISO_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
// Match DD.MM.YYYY or DD/MM/YYYY
const DATE_EU_RE = /\b(\d{2})[./](\d{2})[./](\d{4})\b/g;

function parseDatesFromText(text) {
  const dates = [];
  let m;

  DATE_ISO_RE.lastIndex = 0;
  while ((m = DATE_ISO_RE.exec(text)) !== null) {
    dates.push(new Date(`${m[1]}-${m[2]}-${m[3]}`));
  }

  DATE_EU_RE.lastIndex = 0;
  while ((m = DATE_EU_RE.exec(text)) !== null) {
    dates.push(new Date(`${m[3]}-${m[2]}-${m[1]}`));
  }

  return dates.filter(d => !isNaN(d.getTime()));
}

function extractConstraintsSection(content) {
  const match = content.match(/#+\s+(?:Project\s+Constraint|Timeline|Schedule)[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : content;
}

function extractRoadmapSection(content) {
  const match = content.match(/#+\s+(?:Implementation\s+Phase|Key\s+Milestone|Roadmap|Critical\s+Path)[^]*?(?=\n#+\s|$)/i);
  return match ? match[0] : content;
}

/** Role → default BABOK stage number; a profile may rebind these. */
export const DEFAULT_BINDINGS = { charter: 1, roadmap: 6 };

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @param {{ charter?: number, roadmap?: number }} [bindings]
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts, bindings = DEFAULT_BINDINGS) {
  const b = { ...DEFAULT_BINDINGS, ...bindings };
  const stage1 = artifacts[`stage${b.charter}`];
  const stage6 = artifacts[`stage${b.roadmap}`];

  if (!stage1 || !stage6) return [];

  const constraintSection = extractConstraintsSection(stage1);
  const roadmapSection = extractRoadmapSection(stage6);

  const stage1Dates = parseDatesFromText(constraintSection);
  const stage6Dates = parseDatesFromText(roadmapSection);

  if (stage1Dates.length === 0 || stage6Dates.length === 0) return [];

  // Target go-live from Stage 1: use the latest date mentioned in constraints
  const stage1Target = new Date(Math.max(...stage1Dates.map(d => d.getTime())));
  // Roadmap completion from Stage 6: use the latest date
  const stage6Completion = new Date(Math.max(...stage6Dates.map(d => d.getTime())));

  // 3-month tolerance in ms
  const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

  if (stage6Completion.getTime() > stage1Target.getTime() + THREE_MONTHS_MS) {
    return [
      {
        ruleId: 'ROADMAP-DATE',
        severity: 'warning',
        message: `Stage ${b.roadmap} roadmap completion (${stage6Completion.toISOString().slice(0, 10)}) is more than 3 months after the Stage ${b.charter} target (${stage1Target.toISOString().slice(0, 10)})`,
        stagesInvolved: [b.charter, b.roadmap],
        remediation: `Align the Stage ${b.roadmap} roadmap end date with the Stage ${b.charter} target go-live date, or update Stage ${b.charter} constraints to reflect the revised timeline`,
      },
    ];
  }

  return [];
}
