import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProjectDir } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// quality_audit_agent.md: cli/src/orchestrator → ../../../ = BABOK_ANALYST/
const AUDIT_PROMPT_PATH = path.join(
  __dirname, '..', '..', '..', 'BABOK_AGENT', 'agents', 'quality_audit_agent.md'
);

const FALLBACK_AUDIT_PROMPT =
  'You are a BABOK v3 quality auditor. Evaluate the artefact and return a JSON object ' +
  'with keys: overall (number 0-100), completeness (number), consistency (number), ' +
  'quality (number), improvements (array of strings).';

function loadAuditPrompt() {
  try {
    return fs.readFileSync(AUDIT_PROMPT_PATH, 'utf-8');
  } catch {
    return FALLBACK_AUDIT_PROMPT;
  }
}

/** Extract a JSON object from an LLM response that may contain markdown fences. */
function parseScoreResponse(response) {
  // Try ```json ... ``` block first
  const fenced = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : response;

  // Find the first {...} block
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;

  try {
    return JSON.parse(objMatch[0]);
  } catch {
    return null;
  }
}

/**
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} artefact
 * @param {object} llmClient - { chat(systemPrompt, userMessage): Promise<string> }
 * @param {{ maxIterations?: number, scoreThreshold?: number, onIteration?: Function, dryRun?: boolean }} options
 * @returns {Promise<{ finalArtefact: string, finalScore: number, iterations: number, passed: boolean, escalated: boolean }>}
 */
export async function runQualityLoop(projectId, stageNumber, artefact, llmClient, options = {}) {
  const {
    maxIterations = 3,
    scoreThreshold = 75,
    onIteration,
    dryRun = false,
  } = options;

  if (dryRun) {
    return { finalArtefact: artefact, finalScore: 80, iterations: 1, passed: true, escalated: false };
  }

  const auditSystemPrompt = loadAuditPrompt();
  const iterDir = path.join(getProjectDir(projectId), 'quality_iterations');
  fs.mkdirSync(iterDir, { recursive: true });

  let currentArtefact = artefact;
  let finalScore = 0;
  let passed = false;
  let iteration = 0;

  for (iteration = 1; iteration <= maxIterations; iteration++) {
    // Step a: score the artefact
    const scoreMessage =
      'Score this BABOK stage ' + stageNumber + ' artefact and return JSON: ' +
      '{"overall":number,"completeness":number,"consistency":number,"quality":number,' +
      '"improvements":["string"]}\n\nARTEFACT:\n' + currentArtefact;

    const scoreResponse = await llmClient.chat(auditSystemPrompt, scoreMessage);
    const scoreObj = parseScoreResponse(scoreResponse);
    finalScore = scoreObj?.overall ?? 50;

    // Save iteration snapshot
    const stageTag = String(stageNumber).padStart(2, '0');
    const snapshotPath = path.join(iterDir, `STAGE_${stageTag}_iter${iteration}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify({
      stage: stageNumber,
      iteration,
      score: scoreObj ?? { overall: finalScore },
      artefactLength: currentArtefact.length,
      timestamp: new Date().toISOString(),
    }, null, 2), 'utf-8');

    onIteration?.({ stage: stageNumber, iteration, score: finalScore, escalated: false });

    // Step e: passed?
    if (finalScore >= scoreThreshold) {
      passed = true;
      break;
    }

    // Step f: not last iteration — request improvements
    if (iteration < maxIterations) {
      const improvements = Array.isArray(scoreObj?.improvements)
        ? scoreObj.improvements.join('\n- ')
        : 'Improve completeness, consistency, and SMART quality.';

      const improveMessage =
        'Improve this BABOK stage ' + stageNumber + ' artefact based on the following issues:\n' +
        '- ' + improvements + '\n\n' +
        'Return the complete improved artefact.\n\nARTEFACT:\n' + currentArtefact;

      currentArtefact = await llmClient.chat(auditSystemPrompt, improveMessage);
    }
  }

  const escalated = !passed;

  if (escalated) {
    onIteration?.({ stage: stageNumber, iteration: maxIterations, score: finalScore, escalated: true });
  }

  // Update journal
  try {
    const journal = readJournal(projectId);
    journal.quality_reports = journal.quality_reports || {};
    journal.quality_reports[`stage${stageNumber}`] = {
      scores: { overall: finalScore },
      iterations: iteration > maxIterations ? maxIterations : iteration,
      passed,
      escalated,
    };
    writeJournal(projectId, journal);
  } catch {
    // Journal may not exist in pipeline-only mode — non-fatal
  }

  return {
    finalArtefact: currentArtefact,
    finalScore,
    iterations: iteration > maxIterations ? maxIterations : iteration,
    passed,
    escalated,
  };
}
