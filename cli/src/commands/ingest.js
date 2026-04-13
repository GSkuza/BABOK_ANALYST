import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';
import { parseDocument } from '../lib/document-parser.js';
import {
  getApiKey,
  initializeProvider,
  startChatSession,
  sendMessageStream,
} from '../llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TAGGER_PROMPT_PATH = path.join(__dirname, '..', 'reasoning', 'prompts', 'ingest_tagger.md');

/**
 * Ingest a document into a project's context.
 * @param {string} filePath
 * @param {{ project?: string }} options
 */
export async function ingestCommand(filePath, options) {
  // 1. Resolve project
  const projectId = resolveProjectId(options.project);
  if (!projectId) {
    console.error(chalk.red(
      options.project
        ? `Error: Project not found: ${options.project}`
        : 'Error: No project ID provided and multiple (or zero) projects exist. Use -p <id>.'
    ));
    process.exit(1);
  }

  const projectDir = getProjectDir(projectId);

  // 2. Parse document
  let parsed;
  try {
    parsed = await parseDocument(filePath);
  } catch (err) {
    console.error(chalk.red(`Error parsing document: ${err.message}`));
    process.exit(1);
  }

  console.log(chalk.cyan(`  Ingesting: ${parsed.fileName} (${parsed.fileType}, ${parsed.sections.length} section(s))...`));

  // 3. LLM tagging — graceful fallback
  let tags = [];
  try {
    const taggerSystemPrompt = fs.readFileSync(TAGGER_PROMPT_PATH, 'utf-8');

    const apiKey = getApiKey();
    await initializeProvider(undefined, apiKey, undefined);

    const sectionSummary = parsed.sections.map((s, i) => ({
      index: i,
      pageOrSheet: s.pageOrSheet,
      preview: s.content.slice(0, 600),
    }));
    const userMessage = JSON.stringify(sectionSummary, null, 2);

    startChatSession(taggerSystemPrompt, []);

    let rawResponse = '';
    await sendMessageStream(userMessage, (chunk) => { rawResponse += chunk; });

    // Strip markdown fences if present
    const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      rawResponse.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawResponse.trim();
    const parsed2 = JSON.parse(jsonStr);
    if (Array.isArray(parsed2.tags)) {
      tags = parsed2.tags;
    }
  } catch (err) {
    // Categorize the error for easier troubleshooting
    let reason;
    if (err.message && /api.?key|authentication|unauthorized|forbidden/i.test(err.message)) {
      reason = `API key not configured or invalid: ${err.message}`;
    } else if (err.message && /network|ECONNREFUSED|ETIMEDOUT|fetch/i.test(err.message)) {
      reason = `Network error: ${err.message}`;
    } else if (err instanceof SyntaxError) {
      reason = `Invalid JSON response from LLM: ${err.message}`;
    } else {
      reason = err.message;
    }
    console.log(chalk.yellow(`  [ingest] LLM tagging skipped: ${reason}`));
    tags = [];
  }

  // 4. Build result object
  const result = {
    fileName: parsed.fileName,
    fileType: parsed.fileType,
    ingestedAt: new Date().toISOString(),
    sections: parsed.sections,
    tags,
  };

  // 5. Save to <projectDir>/ingested/<filename>.json
  const ingestedDir = path.join(projectDir, 'ingested');
  fs.mkdirSync(ingestedDir, { recursive: true });
  const outPath = path.join(ingestedDir, parsed.fileName + '.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  // 6. Update journal
  const journal = readJournal(projectId);
  if (!journal.ingested_documents) journal.ingested_documents = [];
  const stagesTagged = [...new Set(tags.flatMap(t => t.stageRelevance || []))];
  journal.ingested_documents.push({
    fileName: parsed.fileName,
    ingestedAt: result.ingestedAt,
    stagesTagged,
  });
  writeJournal(projectId, journal);

  // 7. Print success
  console.log(chalk.green(
    `  ✅ Ingested: ${parsed.fileName} — ${parsed.sections.length} section(s)` +
    (stagesTagged.length > 0 ? `, tagged: ${stagesTagged.join(', ')}` : ', untagged')
  ));
  console.log(chalk.dim(`     Saved to: ${outPath}`));
}
