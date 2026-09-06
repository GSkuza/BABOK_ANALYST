import fs from 'fs';
import path from 'path';
import { getProjectDir } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';
import { DEFAULT_PROFILE_ID, loadProfile, resolveProfilePath } from '../profiles.js';
import { iterateUntilThreshold } from '../quality/iterate-loop.js';
import { loadRubric } from '../templates.js';
import { scoreContent } from '../quality/score-content.js';

const DEFAULT_FALLBACK_SCORE = 50;

const FALLBACK_AUDIT_PROMPT =
  'You are a BABOK v3 quality auditor. Evaluate the artefact and return a JSON object ' +
  'with keys: overall (number 0-100), completeness (number), consistency (number), ' +
  'quality (number), improvements (array of strings).';

function loadAuditPrompt(profile) {
  try {
    return fs.readFileSync(path.join(resolveProfilePath(profile, 'agents_dir'), 'quality_audit_agent.md'), 'utf-8');
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
 * @param {{ maxIterations?: number, scoreThreshold?: number, onIteration?: Function, dryRun?: boolean, profile?: string|object }} options
 * @returns {Promise<{ finalArtefact: string, finalScore: number, iterations: number, passed: boolean, escalated: boolean }>}
 */
export async function runQualityLoop(projectId, stageNumber, artefact, llmClient, options = {}) {
  const {
    maxIterations = 3,
    scoreThreshold = 75,
    onIteration,
    taskRouter,
    dryRun = false,
    profile: profileOpt,
  } = options;

  if (dryRun) {
    return { finalArtefact: artefact, finalScore: 80, iterations: 1, passed: true, escalated: false };
  }

  const profile = typeof profileOpt === 'string' ? loadProfile(profileOpt) : (profileOpt ?? loadProfile(DEFAULT_PROFILE_ID));
  const auditSystemPrompt = loadAuditPrompt(profile);
  const iterDir = path.join(getProjectDir(projectId), 'quality_iterations');
  fs.mkdirSync(iterDir, { recursive: true });
  const stageTag = String(stageNumber).padStart(2, '0');

  const scoreFn = async (content, iteration) => {
    let scoreObj = null;
    if (options.localOnly) {
      const rubric = loadRubric(profile);
      const result = await scoreContent(content, rubric.stages[`stage${stageNumber}`] || {}, rubric);
      scoreObj = { ...result.scores, issues: result.issues, validation: 'local' };
    } else if (taskRouter?.scoreQuality) {
      try {
        scoreObj = await taskRouter.scoreQuality({ stageNumber, artefact: content });
      } catch {
        scoreObj = null;
      }
    }

    if (!scoreObj) {
      const scoreMessage =
        'Score this BABOK stage ' + stageNumber + ' artefact and return JSON: ' +
        '{"overall":number,"completeness":number,"consistency":number,"quality":number,' +
        '"improvements":["string"]}\n\nARTEFACT:\n' + content;

      const scoreResponse = await llmClient.chat(auditSystemPrompt, scoreMessage);
      scoreObj = parseScoreResponse(scoreResponse);
    }

    // Save iteration snapshot (same on-disk shape as before the iterate-loop extraction)
    const snapshotPath = path.join(iterDir, `STAGE_${stageTag}_iter${iteration}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify({
      stage: stageNumber,
      iteration,
      score: scoreObj ?? { overall: DEFAULT_FALLBACK_SCORE },
      artefactLength: content.length,
      timestamp: new Date().toISOString(),
    }, null, 2), 'utf-8');

    return scoreObj;
  };

  const reviseFn = async (content, scoreObj) => {
    const improvements = Array.isArray(scoreObj?.improvements)
      ? scoreObj.improvements.join('\n- ')
      : 'Improve completeness, consistency, and SMART quality.';

    const improveMessage =
      'Improve this BABOK stage ' + stageNumber + ' artefact based on the following issues:\n' +
      '- ' + improvements + '\n\n' +
      'Return the complete improved artefact.\n\nARTEFACT:\n' + content;

    return llmClient.chat(auditSystemPrompt, improveMessage);
  };

  const result = await iterateUntilThreshold(artefact, {
    scoreFn,
    reviseFn,
    maxIterations: options.localOnly ? 1 : maxIterations,
    threshold: scoreThreshold,
    defaultScore: DEFAULT_FALLBACK_SCORE,
    onIteration: (e) => onIteration?.({ stage: stageNumber, iteration: e.iteration, score: e.score, escalated: e.escalated }),
  });

  // Update journal
  try {
    const journal = readJournal(projectId);
    journal.quality_reports = journal.quality_reports || {};
    journal.quality_reports[`stage${stageNumber}`] = {
      scores: { overall: result.finalScore },
      iterations: result.iterations,
      passed: result.passed,
      escalated: result.escalated,
    };
    writeJournal(projectId, journal);
  } catch {
    // Journal may not exist in pipeline-only mode — non-fatal
  }

  return {
    finalArtefact: result.content,
    finalScore: result.finalScore,
    iterations: result.iterations,
    passed: result.passed,
    escalated: result.escalated,
  };
}
