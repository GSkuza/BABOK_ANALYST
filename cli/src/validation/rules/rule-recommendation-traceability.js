/**
 * Rule RECOMMENDATION-TRACEABILITY
 *
 * Checks that every option identifier (OPT-NN) named in the recommendation
 * section of the options stage is carried into the target-operating-model
 * stage, so the design actually implements what was recommended.
 */

const OPT_ID_RE = /\bOPT-\d{2,}\b/g;

function extractSection(content, headingRe) {
  const match = content.match(headingRe);
  return match ? match[0] : null;
}

const RECOMMENDATION_RE = /#+\s+Recommended\s+Option[^]*?(?=\n#+\s|$)/i;
const TOM_RE = /#+\s+Target\s+Operating\s+Model[^]*?(?=\n#+\s|$)/i;

/** Role → default consulting stage number; a profile may rebind these. */
export const DEFAULT_BINDINGS = { options: 3, tom: 4 };

/**
 * @param {{ [key: string]: string|null }} artifacts
 * @param {{ options?: number, tom?: number }} [bindings]
 * @returns {import('../cross-stage-validator.js').Finding[]}
 */
export function check(artifacts, bindings = DEFAULT_BINDINGS) {
  const b = { ...DEFAULT_BINDINGS, ...bindings };
  const optionsDoc = artifacts[`stage${b.options}`];
  const tomDoc = artifacts[`stage${b.tom}`];
  if (!optionsDoc || !tomDoc) return [];

  const recommendation = extractSection(optionsDoc, RECOMMENDATION_RE);
  if (!recommendation) {
    return [{
      ruleId: 'RECOMMENDATION-TRACEABILITY',
      severity: 'warning',
      message: `Stage ${b.options} has no "Recommended Option & Rationale" section`,
      stagesInvolved: [b.options],
      remediation: 'Add a "Recommended Option & Rationale" section naming the chosen option by its OPT-NN identifier',
    }];
  }

  const recommended = [...new Set([...recommendation.matchAll(OPT_ID_RE)].map(m => m[0]))];
  if (recommended.length === 0) {
    return [{
      ruleId: 'RECOMMENDATION-TRACEABILITY',
      severity: 'error',
      message: `Stage ${b.options} recommendation does not reference any option by OPT-NN identifier`,
      stagesInvolved: [b.options],
      remediation: 'Identify the recommended option with its OPT-NN id from the Options Evaluation Matrix',
    }];
  }

  const tomSection = extractSection(tomDoc, TOM_RE) ?? tomDoc;
  const tomIds = new Set([...tomSection.matchAll(OPT_ID_RE)].map(m => m[0]));
  const missing = recommended.filter(id => !tomIds.has(id));

  if (missing.length > 0) {
    return [{
      ruleId: 'RECOMMENDATION-TRACEABILITY',
      severity: 'error',
      message: `Stage ${b.tom} Target Operating Model does not reference recommended option(s): ${missing.join(', ')}`,
      stagesInvolved: [b.options, b.tom],
      remediation: `State in Stage ${b.tom} which recommended option (${missing.join(', ')}) the Target Operating Model implements`,
    }];
  }

  return [];
}
