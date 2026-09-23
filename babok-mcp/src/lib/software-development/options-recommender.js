/**
 * Autonomous Stage 3 (Options & Architecture Decisions) recommender for the
 * software-development profile.
 *
 * Unlike Stage 1's baseline-builder.js, this stage cannot be done mechanically:
 * generating genuinely distinct options, weighing trade-offs and drafting ADRs
 * requires real reasoning. This module therefore REQUIRES an llmClient — it
 * throws a clear, actionable error rather than fabricating a plausible-looking
 * recommendation with no reasoning behind it.
 *
 * Implements the profile's autonomous design loop
 * (profiles/software-development/stages/SoftwareDevelopment_agent_stage_3.md):
 * reuse check -> option generation (incl. an explicit do-nothing baseline) ->
 * evaluation -> recommendation + ADRs -> compatibility/migration -> a second,
 * independent LLM call that critiques the draft against the same evidence and
 * either confirms it or returns a corrected version. The critique step is not
 * optional or decorative: its issues are always surfaced, and a "corrected"
 * result always replaces the draft in the final output.
 *
 * The model is asked for a single JSON object (not a full markdown document);
 * turning that into the Stage 3 Markdown deliverable is the caller's job
 * (e.g. via the existing templates/rubric generation pipeline), so this
 * module stays testable independent of document formatting.
 *
 * This file is byte-identical in cli/src/software-development/options-recommender.js
 * and babok-mcp/src/lib/software-development/options-recommender.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

const DRAFT_SYSTEM_PROMPT = `You are the Stage 3 (Options & Architecture Decisions) autonomous agent of the
BABOK Analyst software-development profile. You are given: (a) a Stage 1 baseline's
evidence ledger (EV-NNN citations about an existing product's code, architecture and
SDLC), (b) a Stage 2 change-impact summary, (c) explicit constraints. Do not invent
facts about the codebase beyond what the evidence states.

Follow this loop, then respond with ONE JSON object and nothing else (no markdown
fences, no commentary before or after):
1. Reuse check: does the Stage 1 evidence show an existing mechanism that already
   addresses part of the change? State it or say none applies.
2. Generate 2-4 substantively different options PLUS an explicit "OPT-00" do-nothing/
   defer baseline. Each option must reference which Stage 2 impact items it addresses.
3. Define evaluation criteria with weights summing to 100 and a stated source for each
   (e.g. "Stage 0 risk appetite", "Stage 2 constraint").
4. Score every option (including OPT-00) against every criterion and compute a
   weighted total.
5. Recommend exactly one option (never OPT-00 unless it truly is the best choice),
   stating its weighted score and the runner-up's, and draft an ADR for each key
   decision the recommendation implies.
6. State the compatibility and migration approach the recommendation requires.

Respond with exactly this JSON shape:
{
  "reuse_assessment": "string",
  "options": [ { "id": "OPT-00", "summary": "string", "addresses": ["string"] } ],
  "evaluation_criteria": [ { "criterion": "string", "weight": 0, "source": "string" } ],
  "evaluation_matrix": [ { "option_id": "OPT-00", "scores": { "criterion name": 0 }, "weighted_total": 0 } ],
  "recommended_option_id": "OPT-01",
  "recommendation_rationale": "string, must state the weighted score vs the runner-up",
  "adrs": [ { "id": "ADR-01", "context": "string", "decision": "string", "consequences": "string", "alternatives_considered": "string", "related_requirements": ["string"] } ],
  "compatibility_migration_approach": "string"
}`;

const CRITIQUE_SYSTEM_PROMPT = `You are an independent, skeptical reviewer auditing a Stage 3 draft (JSON) against
the same Stage 1 evidence and Stage 2/constraints context the drafting agent saw.
Look specifically for:
- a claim in the draft not supported by any cited EV-NNN evidence
- a contradiction with a stated constraint
- a missing OPT-00 do-nothing baseline, or evaluation weights that do not sum to 100
- a recommendation that does not state its weighted score against the runner-up
- an ADR missing context, decision, consequences, or alternatives considered

Respond with ONE JSON object and nothing else:
{
  "issues": [ { "severity": "critical"|"minor", "description": "string" } ],
  "corrected_draft": <the full corrected draft in the exact same JSON shape you were given, with every issue above fixed> or null if no correction was needed
}`;

/** Extract the first {...} JSON object from a response that may include stray text/fences. */
function parseJsonResponse(text, label) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error(`${label}: response did not contain a JSON object.\n---\n${text.slice(0, 500)}`);
  try {
    return JSON.parse(objMatch[0]);
  } catch (err) {
    throw new Error(`${label}: response JSON could not be parsed (${err.message}).\n---\n${objMatch[0].slice(0, 500)}`);
  }
}

/**
 * @param {{ evidence?: Array<{id:string,claim:string}>, narrative?: string }} baseline
 * @param {string} changeGoal
 * @param {string[]} constraints
 */
function buildUserPrompt(baseline, changeGoal, constraints) {
  const evidenceLines = (baseline.evidence ?? []).map(e => `- ${e.id}: ${e.claim}`).join('\n') || '(no evidence provided)';
  const lines = [
    '## Stage 1 Baseline Evidence',
    evidenceLines,
    '',
    baseline.narrative ? `## Stage 1 Narrative\n${baseline.narrative}\n` : '',
    '## Change Goal (from Stage 0/2)',
    changeGoal,
    '',
    '## Constraints',
    constraints.length > 0 ? constraints.map(c => `- ${c}`).join('\n') : '(none stated beyond the change goal)',
    '',
    'Produce the Stage 3 JSON now.',
  ];
  return lines.filter(Boolean).join('\n');
}

/**
 * @param {{
 *   baseline: { evidence?: object[], narrative?: string },
 *   changeGoal: string,
 *   constraints?: string[],
 *   llmClient: { chat: (system: string, user: string) => Promise<string>, modelName?: string },
 * }} options
 * @returns {Promise<{
 *   draft: object, critique: { issues: Array<{severity:string,description:string}>, corrected: boolean },
 *   final: object, model: string|undefined,
 * }>}
 */
export async function recommendOptions(options) {
  const { baseline, changeGoal, constraints = [], llmClient } = options;
  if (!llmClient) {
    throw new Error(
      'recommendOptions: an llmClient is required. Stage 3 option generation needs real reasoning '
      + '(distinct from Stage 1\'s mechanical evidence gathering) — configure an LLM provider before calling this.',
    );
  }

  const userPrompt = buildUserPrompt(baseline, changeGoal, constraints);
  const draftText = await llmClient.chat(DRAFT_SYSTEM_PROMPT, userPrompt);
  const draft = parseJsonResponse(draftText, 'Stage 3 draft');

  const critiqueUserPrompt = `${userPrompt}\n\n## Draft to Review\n${JSON.stringify(draft, null, 2)}`;
  const critiqueText = await llmClient.chat(CRITIQUE_SYSTEM_PROMPT, critiqueUserPrompt);
  const critiqueRaw = parseJsonResponse(critiqueText, 'Stage 3 critique');

  const issues = Array.isArray(critiqueRaw.issues) ? critiqueRaw.issues : [];
  const corrected = critiqueRaw.corrected_draft ?? null;

  return {
    draft,
    critique: { issues, corrected: corrected !== null },
    final: corrected ?? draft,
    model: llmClient.modelName,
  };
}
