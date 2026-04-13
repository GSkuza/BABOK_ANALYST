/**
 * Multi-Perspective Reasoning: Debate Pattern
 *
 * Runs an Analyst → Critic → Synthesiser debate for deep analysis stages (3, 4, 6, 8).
 * Returns null for all other stages.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/** Stages that trigger deep analysis debate */
const DEEP_ANALYSIS_STAGES = new Set([3, 4, 6, 8]);

/**
 * Load a prompt file from the prompts directory.
 * @param {string} name - file name (without path)
 * @returns {string}
 */
function loadPrompt(name) {
  const filePath = path.join(PROMPTS_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Debate prompt file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Serialise the project context object to a human-readable string for injection
 * into LLM prompts.
 * @param {object} context
 * @returns {string}
 */
function serialiseContext(context) {
  return JSON.stringify(context, null, 2);
}

/**
 * Run the Analyst → Critic → Synthesiser debate for a given stage.
 *
 * The `llmClient` must expose:
 *   `chat(systemPrompt: string, userMessage: string): Promise<string>`
 *
 * In production this wraps `startChatSession` + `sendMessageStream` from llm.js.
 * In tests, use the mock returned by `createMockLlm`.
 *
 * @param {number} stageNumber
 * @param {object} context  - project context (from project_context.json)
 * @param {{ chat: Function }} llmClient
 * @param {object} [options]
 * @param {string} [options.model]  - model name for metadata
 * @returns {Promise<{analyst: string, critic: string, synthesis: string, metadata: object}|null>}
 */
export async function runDebate(stageNumber, context, llmClient, options = {}) {
  if (!DEEP_ANALYSIS_STAGES.has(stageNumber)) {
    return null;
  }

  const analystPrompt = loadPrompt('analyst.md');
  const criticPrompt = loadPrompt('critic.md');
  const synthesiserPrompt = loadPrompt('synthesiser.md');

  const contextStr = serialiseContext(context);
  const stageMessage = `Stage ${stageNumber} context:\n\n${contextStr}`;

  const startTime = Date.now();
  const tokenCounts = {};

  // ── Step 1: Analyst pass ──
  const analystSystemPrompt = `${analystPrompt}\n\n## Project Context\n\n\`\`\`json\n${contextStr}\n\`\`\``;
  const analyst = await llmClient.chat(
    analystSystemPrompt,
    `Produce the complete Stage ${stageNumber} deliverable for this project. Be thorough and BABOK-compliant.`
  );
  tokenCounts.analyst = analyst.length; // character-based approximation; replace with real counts if provider exposes them

  // ── Step 2: Critic pass ──
  const criticSystemPrompt = `${criticPrompt}\n\n## Project Context\n\n\`\`\`json\n${contextStr}\n\`\`\``;
  const critic = await llmClient.chat(
    criticSystemPrompt,
    `Here is the analyst's Stage ${stageNumber} deliverable. Challenge it rigorously:\n\n---\n\n${analyst}`
  );
  tokenCounts.critic = critic.length;

  // ── Step 3: Synthesiser pass ──
  const synthesiserUserMessage =
    `## Analyst Output (Stage ${stageNumber})\n\n${analyst}\n\n` +
    `## Critic Output\n\n${critic}\n\n` +
    `Synthesise both into the definitive Stage ${stageNumber} deliverable.`;

  const synthesis = await llmClient.chat(synthesiserPrompt, synthesiserUserMessage);
  tokenCounts.synthesis = synthesis.length;

  const latencyMs = Date.now() - startTime;

  const metadata = {
    model: options.model || 'unknown',
    tokenCounts,
    latencyMs,
    stageNumber,
    timestamp: new Date().toISOString(),
  };

  return { analyst, critic, synthesis, metadata };
}

/**
 * Attach debate metadata to a journal stage entry.
 * Mutates the stage object in place and writes the journal file.
 *
 * @param {object} journal         - full journal object (already in memory)
 * @param {number} stageNum
 * @param {object} debateMetadata  - metadata from runDebate()
 * @param {string} projectDir      - project directory for writing journal
 */
export function markDebateInJournal(journal, stageNum, debateMetadata, projectDir) {
  const stage = journal.stages.find(s => s.stage === stageNum);
  if (stage) {
    stage.debate_used = true;
    stage.debate_metadata = debateMetadata;
  }
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${journal.project_id}.json`);
  journal.last_updated = new Date().toISOString();
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
}
