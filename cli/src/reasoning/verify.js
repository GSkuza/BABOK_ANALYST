/**
 * Chain-of-Verification (CoVe) for BABOK stage deliverables.
 *
 * Steps:
 *   1. Generate numbered verification questions about the analysis.
 *   2. Answer each question: CONFIRMED | UNCERTAIN | REFUTED.
 *   3. If any UNCERTAIN/REFUTED, run a correction pass.
 *   4. Save verification report to <projectDir>/STAGE_NN_verification.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, 'prompts');

/**
 * Load a prompt file from the prompts directory.
 * @param {string} name
 * @returns {string}
 */
function loadPrompt(name) {
  const filePath = path.join(PROMPTS_DIR, name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CoVe prompt file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse the numbered question list returned by the LLM.
 * @param {string} raw  - raw LLM output
 * @returns {string[]}
 */
function parseQuestions(raw) {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^\d+[\.\)]\s/.test(l))
    .map(l => l.replace(/^\d+[\.\)]\s+/, '').trim())
    .filter(Boolean);
}

/**
 * Parse a single verification answer.
 * @param {string} raw
 * @param {string} questionText
 * @param {number} id
 * @returns {{ id: number, text: string, answer: 'CONFIRMED'|'UNCERTAIN'|'REFUTED', justification: string }}
 */
function parseAnswer(raw, questionText, id) {
  const verdictMatch = raw.match(/VERDICT:\s*(CONFIRMED|UNCERTAIN|REFUTED)/i);
  const justMatch = raw.match(/JUSTIFICATION:\s*([\s\S]+)/i);

  const answer = verdictMatch
    ? verdictMatch[1].toUpperCase()
    : 'UNCERTAIN';

  const justification = justMatch
    ? justMatch[1].trim()
    : raw.trim();

  return {
    id,
    text: questionText,
    answer,
    justification,
  };
}

/**
 * Run Chain-of-Verification on a stage analysis.
 *
 * The `llmClient` must expose:
 *   `chat(systemPrompt: string, userMessage: string): Promise<string>`
 *
 * @param {number} stageNumber
 * @param {string} analysis       - stage deliverable text to verify
 * @param {object} context        - project context (ground truth)
 * @param {{ chat: Function }} llmClient
 * @param {object} [options]
 * @param {string} [options.projectDir]   - if provided, saves the report to disk
 * @returns {Promise<{corrected: string, verificationReport: VerificationReport}>}
 *
 * @typedef {{ id: number, text: string, answer: 'CONFIRMED'|'UNCERTAIN'|'REFUTED', justification: string }} Question
 * @typedef {{ questionId: number, original: string, corrected: string }} Correction
 * @typedef {{ questions: Question[], corrections: Correction[], questionsTotal: number, refutedCount: number }} VerificationReport
 */
export async function runCoVe(stageNumber, analysis, context, llmClient, options = {}) {
  const questionGenPrompt = loadPrompt('cove_question_gen.md');
  const answerPrompt = loadPrompt('cove_answer.md');
  const correctionPrompt = loadPrompt('cove_correction.md');

  const contextStr = JSON.stringify(context, null, 2);

  // ── Step 1: Generate verification questions ──
  const questionsRaw = await llmClient.chat(
    questionGenPrompt,
    `Stage ${stageNumber} analysis to verify:\n\n${analysis}`
  );
  const questionTexts = parseQuestions(questionsRaw);

  // ── Step 2: Answer each question ──
  const questions = [];
  for (let i = 0; i < questionTexts.length; i++) {
    const userMsg =
      `## Project Context (ground truth)\n\`\`\`json\n${contextStr}\n\`\`\`\n\n` +
      `## Stage ${stageNumber} Analysis\n${analysis}\n\n` +
      `## Verification Question\n${questionTexts[i]}`;

    const answerRaw = await llmClient.chat(answerPrompt, userMsg);
    questions.push(parseAnswer(answerRaw, questionTexts[i], i + 1));
  }

  // ── Step 3: Correction pass if needed ──
  const issueQuestions = questions.filter(
    q => q.answer === 'UNCERTAIN' || q.answer === 'REFUTED'
  );

  const corrections = [];
  let corrected = analysis;

  if (issueQuestions.length > 0) {
    const findingsList = issueQuestions
      .map(q => `Q${q.id} [${q.answer}]: ${q.text}\nJustification: ${q.justification}`)
      .join('\n\n');

    const correctionUserMsg =
      `## Original Analysis\n\n${analysis}\n\n` +
      `## Verification Findings Requiring Correction\n\n${findingsList}`;

    const correctedRaw = await llmClient.chat(correctionPrompt, correctionUserMsg);

    // Extract the corrected analysis (everything before the horizontal rule separator)
    const sepIdx = correctedRaw.lastIndexOf('\n---\n');
    corrected = sepIdx > 0
      ? correctedRaw.substring(0, sepIdx).trim()
      : correctedRaw.trim();

    // Build correction records (one per issue question)
    for (const q of issueQuestions) {
      corrections.push({
        questionId: q.id,
        original: q.text,
        corrected: `Applied correction based on ${q.answer} verdict: ${q.justification}`,
      });
    }
  }

  const verificationReport = {
    stageNumber,
    timestamp: new Date().toISOString(),
    questions,
    corrections,
    questionsTotal: questions.length,
    refutedCount: questions.filter(q => q.answer === 'REFUTED').length,
  };

  // ── Step 4: Persist report to disk ──
  if (options.projectDir) {
    const stageLabel = String(stageNumber).padStart(2, '0');
    const reportPath = path.join(
      options.projectDir,
      `STAGE_${stageLabel}_verification.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2), 'utf-8');
  }

  return { corrected, verificationReport };
}
