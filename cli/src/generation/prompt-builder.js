/**
 * Shared "base" system prompt assembly for stage deliverable generation:
 * main system prompt + stage prompt + output templates + project context.
 * Used by both cli/src/commands/run.js (default path) and
 * cli/src/orchestrator/stage-executor.js (--orchestrate path) so both
 * generate against the same prompt fidelity instead of the orchestrator
 * using a one-line placeholder prompt.
 *
 * The generator adds all section and rubric instructions to this base for
 * one complete-document request.
 */

import { loadMainSystemPrompt, loadStagePrompt } from '../llm.js';
import { loadTemplatesForStage } from '../templates.js';
import { limitProjectContext } from '../context-window.js';

/**
 * @param {object} profile
 * @param {number} stageNumber
 * @param {object} projectContext
 * @param {string} language - 'PL' | 'EN'
 * @param {{ prevContext?: string }} [options] - prevContext: serialized previous-stage
 *   outputs block (see run.js's buildPreviousOutputsContext), appended verbatim if given.
 * @returns {string}
 */
export function buildStageSystemPromptBase(profile, stageNumber, projectContext, language, options = {}) {
  const { prevContext = '' } = options;

  const mainPrompt = loadMainSystemPrompt(profile);
  const stagePrompt = loadStagePrompt(stageNumber, profile);
  const templates = loadTemplatesForStage(stageNumber, { includeModules: true, projectContext, profile }).text;
  const contextJson = JSON.stringify(limitProjectContext(projectContext), null, 2);

  const langInstruction = language === 'PL'
    ? 'LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in Polish language.'
    : 'LANGUAGE REQUIREMENT: Respond in English language.';

  return `${mainPrompt}\n\n${stagePrompt}\n\n=== PROJECT CONTEXT ===\n${contextJson}\n=== END PROJECT CONTEXT ===${prevContext}${templates}\n\n=== GENERATION MODE ===
You are producing a complete, professional BABOK v3 stage deliverable directly in this mode (no back-and-forth
questions here). Ground every claim in the project context above. Where specific data is genuinely missing,
state a clearly-labeled assumption ("Assumption: ...") instead of inventing a precise-sounding number or date
as if it were a known fact.
${langInstruction}
=== END GENERATION MODE ===\n`;
}
