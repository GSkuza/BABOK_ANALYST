import fs from 'fs';
import path from 'path';
import { getProjectDir } from '../project.js';

/**
 * @param {string} stageKey - e.g. 'stage1', 'stage2', 'stage7_initial_risk_scan'
 * @param {object} stageConfig - parsed stage config JSON
 * @param {object} context - current pipeline context
 * @param {object} llmClient - { chat(systemPrompt, userMessage): Promise<string> }
 * @param {{ dryRun?: boolean, projectId?: string }} options
 * @returns {Promise<{ key: string, artefact: string, durationMs: number, dryRun: boolean }>}
 */
export async function executeStage(stageKey, stageConfig, context, llmClient, options = {}) {
  const { dryRun = false, projectId } = options;

  if (dryRun) {
    return {
      key: stageKey,
      artefact: '[DRY RUN] Stage ' + stageKey + ' placeholder artefact',
      durationMs: 0,
      dryRun: true,
    };
  }

  const systemPrompt = 'You are a BABOK analyst. Produce stage deliverable for: ' + stageKey;
  // Build a context summary: truncate the raw string to avoid cutting mid-structure
  const contextStr = JSON.stringify(context, null, 2);
  const contextSummary = contextStr.length > 2000
    ? contextStr.substring(0, 1950) + '\n... [context truncated]'
    : contextStr;

  const startMs = Date.now();
  const artefact = await llmClient.chat(systemPrompt, contextSummary);
  const durationMs = Date.now() - startMs;

  if (projectId) {
    const artefactDir = path.join(getProjectDir(projectId), 'artifacts', stageKey);
    fs.mkdirSync(artefactDir, { recursive: true });
    fs.writeFileSync(path.join(artefactDir, 'artefact.md'), artefact, 'utf-8');
  }

  return { key: stageKey, artefact, durationMs, dryRun: false };
}
