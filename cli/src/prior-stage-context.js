/**
 * Cross-stage continuity: renders the deliverables of earlier stages into a
 * prompt block so a stage interview starts from what is already established
 * instead of re-eliciting it.
 *
 * Pure and dependency-free on purpose — callers read the files. Mirrored
 * byte-for-byte in babok-mcp/src/lib/prior-stage-context.js and
 * web/lib/prior-stage-context.js (tests/unit/lib-parity.test.js).
 */

export const PRIOR_CONTEXT_MAX_CHARS = 120000;

const MIN_STAGE_BUDGET = 1500;
const USABLE_STATUSES = new Set(['approved', 'completed', 'in_progress', 'rejected']);
// Sign-off boilerplate carries no evidence for later stages. Whole-heading match only, so
// content headings such as "Approval workflow (AS-IS)" are kept.
const BOILERPLATE_HEADING = /^##\s+[^A-Za-ząćęłńóśźżĄĆĘŁŃÓŚŹŻ]*(quality checklist|lista kontrolna jakości|approval section|human approval|approval|zatwierdzenie|zatwierdzenie etapu|sekcja zatwierdzenia|next steps?|następne kroki)\s*$/i;

/**
 * Remove H2 sections that are sign-off boilerplate (quality checklist,
 * approval block, next-step commands).
 * @param {string} markdown
 * @returns {string}
 */
export function stripBoilerplateSections(markdown) {
  const out = [];
  let skipping = false;
  for (const line of String(markdown).split(/\r?\n/)) {
    if (/^##\s/.test(line)) skipping = BOILERPLATE_HEADING.test(line);
    if (!skipping) out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function truncate(text, budget) {
  if (text.length <= budget) return text;
  const omitted = text.length - budget;
  return `${text.slice(0, budget).trimEnd()}\n\n[… ${omitted} characters omitted to fit the context budget …]`;
}

function statusLabel(status) {
  if (status === 'approved') return 'APPROVED — authoritative';
  if (status === 'completed') return 'SUBMITTED, awaiting human approval';
  return `DRAFT (${status || 'unknown'}) — not yet approved, verify before relying on it`;
}

/**
 * Build the prior-stage evidence block for `currentStage`.
 *
 * Only stages numbered below `currentStage` with non-empty content are used.
 * When the budget is tight the most recent stages keep their full text and
 * older ones are truncated first (the immediately preceding stage is usually
 * the direct input of the current one).
 *
 * @param {Array<{ stage: number, name?: string, status?: string, content?: string|null }>} entries
 * @param {{ currentStage: number, maxChars?: number }} options
 * @returns {string} prompt block, or '' when there is nothing to include
 */
export function buildPriorStageContext(entries, { currentStage, maxChars = PRIOR_CONTEXT_MAX_CHARS } = {}) {
  const usable = (Array.isArray(entries) ? entries : [])
    .filter((entry) => Number.isInteger(entry?.stage) && entry.stage < currentStage)
    .filter((entry) => USABLE_STATUSES.has(entry.status) && typeof entry.content === 'string')
    .map((entry) => ({ ...entry, body: stripBoilerplateSections(entry.content) }))
    .filter((entry) => entry.body.length > 0)
    .sort((a, b) => a.stage - b.stage);
  if (usable.length === 0) return '';

  let remaining = Math.max(maxChars, MIN_STAGE_BUDGET * usable.length);
  const budgets = new Map();
  for (let index = usable.length - 1; index >= 0; index -= 1) {
    const entry = usable[index];
    const reserveForOlder = MIN_STAGE_BUDGET * index;
    const budget = Math.max(MIN_STAGE_BUDGET, Math.min(entry.body.length, remaining - reserveForOlder));
    budgets.set(entry.stage, budget);
    remaining -= Math.min(entry.body.length, budget);
  }

  const sections = usable.map((entry) => [
    `--- Stage ${entry.stage}: ${entry.name || `Stage ${entry.stage}`} [${statusLabel(entry.status)}] ---`,
    truncate(entry.body, budgets.get(entry.stage)),
  ].join('\n'));

  return [
    '=== PRIOR-STAGE DELIVERABLES (evidence already established) ===',
    'These documents were produced in earlier stages of this project. Use them as your evidence base:',
    '- Never ask the human for information these documents already contain; reference it instead (e.g. "Stage 2, Pain Points").',
    '- Open this stage by building on them: state what they already establish for this stage, then ask only about gaps, contradictions or decisions this stage still needs.',
    '- APPROVED documents are authoritative. If new input contradicts them, raise the contradiction once and ask which is correct.',
    '- Do not claim a fact is in a prior document unless it appears below.',
    '',
    sections.join('\n\n'),
    '=== END OF PRIOR-STAGE DELIVERABLES ===',
  ].join('\n');
}
