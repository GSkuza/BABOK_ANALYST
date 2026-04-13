import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { generateProjectId, STAGES } from '../project.js';
import { acquireLock, releaseLock, formatLockInfo } from '../lock.js';
import {
  getApiKey,
  initializeProvider,
  startChatSession,
  sendMessageStream,
  loadStagePrompt,
  loadMainSystemPrompt,
  PROVIDERS,
  promptForProvider,
  listStoredProviders,
} from '../llm.js';
import { runDebate, markDebateInJournal } from '../reasoning/debate.js';
import { runCoVe } from '../reasoning/verify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────
//  Stage → output file name mapping
// ──────────────────────────────────────────────

const STAGE_FILE_NAMES = {
  1: 'STAGE_01_Project_Initialization.md',
  2: 'STAGE_02_Current_State_Analysis.md',
  3: 'STAGE_03_Problem_Domain_Analysis.md',
  4: 'STAGE_04_Solution_Requirements.md',
  5: 'STAGE_05_Future_State_Design.md',
  6: 'STAGE_06_Gap_Analysis_Roadmap.md',
  7: 'STAGE_07_Risk_Assessment.md',
  8: 'STAGE_08_Business_Case_ROI.md',
};

// Templates to inject per stage (format guidance for the AI)
const STAGE_TEMPLATES = {
  1: ['Stakeholder_Analysis_Template.md'],
  4: ['User_Story_Template.md', 'BRD_Template.md'],
  7: ['Risk_Register_Template.md'],
};

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

/** Slugify project name for use in folder ID */
function slugify(name) {
  const PL_MAP = {
    'Ą':'A','ą':'A','Ć':'C','ć':'C','Ę':'E','ę':'E',
    'Ł':'L','ł':'L','Ń':'N','ń':'N','Ó':'O','ó':'O',
    'Ś':'S','ś':'S','Ź':'Z','ź':'Z','Ż':'Z','ż':'Z',
  };
  return name
    .replace(/[ĄąĆćĘęŁłŃńÓóŚśŹźŻż]/g, ch => PL_MAP[ch] || ch)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 25);
}

/** Generate project ID with title slug: BABOK-TITLE-YYYYMMDD-XXXX */
function generateProjectIdWithTitle(projectName) {
  const base = generateProjectId(); // "BABOK-YYYYMMDD-XXXX"
  const slug = slugify(projectName);
  return slug ? base.replace(/^BABOK-/, `BABOK-${slug}-`) : base;
}

/** readline wrapper — ask one question, resolve on Enter */
function askQuestion(rl, question, defaultVal = '') {
  const hint = defaultVal ? chalk.dim(` [${defaultVal}]`) : '';
  return new Promise(resolve => {
    rl.question(chalk.cyan(`  ${question}${hint}: `), answer => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

/**
 * Interactively ask the user for project details and save them back
 * to the context file. Called when the file is empty / lacks project_name.
 */
async function fillContextInteractively(contextPath, context) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('');
  console.log(chalk.bold.yellow('  Konfiguracja projektu'));
  console.log(chalk.dim('  ─────────────────────────────────────────────────────'));
  console.log(chalk.dim('  Plik kontekstu jest pusty. Odpowiedz na pytania ponizej.'));
  console.log(chalk.dim('  Nacisnij Enter, aby pominac opcjonalne pytanie.'));
  console.log('');

  context.project_name = await askQuestion(rl, 'Nazwa projektu *', context.project_name || '');

  const lang = await askQuestion(rl, 'Jezyk analizy (PL/EN)', context.language || 'PL');
  context.language = lang.toUpperCase() === 'EN' ? 'EN' : 'PL';

  if (!context.company) context.company = {};
  context.company.name = await askQuestion(rl, 'Nazwa firmy / organizacji', context.company.name || '');
  context.company.industry = await askQuestion(rl, 'Branza / sektor', context.company.industry || '');

  context.scope = await askQuestion(rl, 'Zakres projektu (opis 1-3 zdania) *', context.scope || '');

  const painRaw = await askQuestion(rl, 'Glowne problemy (oddziel przecinkiem)',
    Array.isArray(context.pain_points) ? context.pain_points.join(', ') : '');
  if (painRaw) context.pain_points = painRaw.split(',').map(s => s.trim()).filter(Boolean);

  if (!context.budget) context.budget = {};
  const budgetRaw = await askQuestion(rl, 'Budzet (np. 500000 PLN)',
    context.budget.estimated || (typeof context.budget === 'string' ? context.budget : ''));
  if (budgetRaw) context.budget = { estimated: budgetRaw };

  if (!context.timeline) context.timeline = {};
  context.timeline.target_date = await askQuestion(rl, 'Planowany termin (RRRR-MM-DD)',
    context.timeline.target_date || '');

  const stakeRaw = await askQuestion(rl, 'Kluczowi interesariusze (oddziel przecinkiem)',
    Array.isArray(context.stakeholders?.key_decision_makers)
      ? context.stakeholders.key_decision_makers.join(', ') : '');
  if (stakeRaw) {
    if (!context.stakeholders) context.stakeholders = {};
    context.stakeholders.key_decision_makers = stakeRaw.split(',').map(s => s.trim()).filter(Boolean);
  }

  const constraintRaw = await askQuestion(rl, 'Ograniczenia / zalozenia (opcjonalnie)',
    Array.isArray(context.constraints) ? context.constraints.join(', ') : '');
  if (constraintRaw) context.constraints = constraintRaw.split(',').map(s => s.trim()).filter(Boolean);

  rl.close();

  // Remove template instructions key if present
  delete context._instructions;

  fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), 'utf-8');
  console.log('');
  console.log(chalk.green(`  Kontekst zapisany: ${contextPath}`));
  console.log('');

  return context;
}

function loadTemplatesForStage(stageNum) {
  const templateFiles = STAGE_TEMPLATES[stageNum] || [];
  // Look for templates/ relative to cwd (workspace root) or 2 levels up from this file
  const dirs = [
    path.join(process.cwd(), 'templates'),
    path.join(__dirname, '..', '..', '..', 'templates'),
  ];

  let result = '';
  for (const f of templateFiles) {
    for (const dir of dirs) {
      const filePath = path.join(dir, f);
      if (fs.existsSync(filePath)) {
        result += `\n\n=== OUTPUT TEMPLATE: ${f} ===\n${fs.readFileSync(filePath, 'utf-8')}\n=== END TEMPLATE ===`;
        break;
      }
    }
  }
  return result;
}

function createRunJournal(projectId, projectName, language, projectDir) {
  const now = new Date().toISOString();
  const journal = {
    project_id: projectId,
    project_name: projectName,
    language,
    created_at: now,
    last_updated: now,
    current_stage: 1,
    current_status: 'in_progress',
    run_mode: 'automated',
    stages: STAGES.map((s, i) => ({
      stage: s.stage,
      name: s.name,
      status: i === 0 ? 'in_progress' : 'not_started',
      started_at: i === 0 ? now : null,
      completed_at: null,
      approved_at: null,
      approved_by: null,
      deliverable_file: null,
      notes: '',
    })),
    decisions: [],
    assumptions: [],
    open_questions: [],
  };
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
  return journal;
}

function updateJournalStage(journal, stageNum, projectDir, fileName) {
  const now = new Date().toISOString();
  const stage = journal.stages.find(s => s.stage === stageNum);
  if (stage) {
    stage.status = 'approved';
    stage.completed_at = now;
    stage.approved_at = now;
    stage.approved_by = 'auto-run';
    stage.deliverable_file = fileName;
  }
  const nextStage = journal.stages.find(s => s.stage === stageNum + 1);
  if (nextStage && nextStage.status === 'not_started') {
    nextStage.status = 'in_progress';
    nextStage.started_at = now;
    journal.current_stage = stageNum + 1;
  }
  if (stageNum === 8) {
    journal.current_status = 'completed';
  }
  journal.last_updated = now;
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${journal.project_id}.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
}

function buildStageSystemPrompt(mainPrompt, stagePrompt, context, language, previousOutputs, stageNum) {
  const langInstruction = language === 'PL'
    ? 'LANGUAGE REQUIREMENT: You MUST respond ENTIRELY in Polish language.'
    : 'LANGUAGE REQUIREMENT: Respond in English language.';

  const prevContext = Object.keys(previousOutputs).length > 0
    ? `\n\n=== PREVIOUS STAGE OUTPUTS (use as context) ===\n${
        Object.entries(previousOutputs)
          .map(([n, content]) => {
            const meta = STAGES.find(s => s.stage === parseInt(n));
            const preview = content.length > 2000 ? content.substring(0, 2000) + '\n...[truncated]' : content;
            return `--- Stage ${n}: ${meta?.name} ---\n${preview}`;
          })
          .join('\n\n')
      }\n=== END PREVIOUS OUTPUTS ===`
    : '';

  const templates = loadTemplatesForStage(stageNum);
  const contextJson = JSON.stringify(context, null, 2);

  return `${mainPrompt}\n\n${stagePrompt}\n\n=== PROJECT CONTEXT ===\n${contextJson}\n=== END PROJECT CONTEXT ===${prevContext}${templates}\n\n=== AUTO-RUN MODE ===
This is AUTOMATED ANALYSIS MODE. You are running as part of an automated pipeline.
CRITICAL RULES:
1. DO NOT ask any questions. Generate the COMPLETE deliverable document immediately.
2. Use the project context above to populate ALL required information.
3. Where specific data is missing, make reasonable professional assumptions and state them clearly.
4. Generate a comprehensive, professional business analysis document following BABOK v3 standards.
5. Structure the output as a complete standalone document with all sections.
6. ${langInstruction}
=== END AUTO-RUN MODE ===\n`;
}

function buildFinalDocument(projectName, projectId, outputs, language) {
  const now = new Date().toISOString().split('T')[0];

  const header = language === 'PL'
    ? `# Kompletna Dokumentacja Analizy BABOK\n\n**Projekt:** ${projectName}  \n**ID:** ${projectId}  \n**Data wygenerowania:** ${now}  \n**Tryb:** Automatyczny (auto-run)  \n**Status:** Kompletny  \n\n`
    : `# Complete BABOK Analysis Documentation\n\n**Project:** ${projectName}  \n**ID:** ${projectId}  \n**Generated:** ${now}  \n**Mode:** Automated (auto-run)  \n**Status:** Complete  \n\n`;

  const tocLabel = language === 'PL' ? '## Spis treści\n\n' : '## Table of Contents\n\n';
  const toc = tocLabel + Object.entries(outputs)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([n]) => {
      const meta = STAGES.find(s => s.stage === parseInt(n));
      return `${n}. [${meta?.name}](#stage-${n})`;
    })
    .join('\n') + '\n\n---\n\n';

  const body = Object.entries(outputs)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([, content]) => content)
    .join('\n\n---\n\n');

  return header + toc + body;
}

function line(char = '─', len = 52) {
  return char.repeat(len);
}

const STAGE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per stage

function sendWithTimeout(userMessage, onChunk) {
  return Promise.race([
    sendMessageStream(userMessage, onChunk),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(
        `Timeout: no response from AI after ${STAGE_TIMEOUT_MS / 60000} minutes.\n` +
        `  Tip: try a smaller/faster model with --model, e.g.:\n` +
        `    babok run --provider gemini --model gemini-2.0-flash\n` +
        `    babok run --provider openai  --model gpt-4o-mini`
      )), STAGE_TIMEOUT_MS)
    ),
  ]);
}

// ──────────────────────────────────────────────
//  Main command
// ──────────────────────────────────────────────

export async function runAnalysis(options) {

  // ── 1. Provider / API key selection (first!) ──
  let provider = options.provider || null;
  let apiKey = null;
  let modelName = options.model || null;

  if (provider && PROVIDERS[provider]) {
    // --provider given explicitly on CLI → just get/verify key
    apiKey = getApiKey(provider);
    if (!apiKey) {
      console.error(chalk.red(`\nError: No API key found for provider: ${provider}`));
      console.error(chalk.dim(`  Set ${PROVIDERS[provider].envKey} in .env  or run: babok llm key`));
      process.exit(1);
    }
  } else {
    // Always show interactive provider+model menu
    try {
      const result = await promptForProvider();
      provider = result.provider;
      apiKey = result.apiKey;
      if (!modelName) modelName = result.model;
    } catch (err) {
      console.error(chalk.red(`\n${err.message}`));
      process.exit(1);
    }
  }

  if (!modelName) {
    modelName = PROVIDERS[provider]?.defaultModel;
  }

  try {
    await initializeProvider(provider, apiKey, modelName);
  } catch (err) {
    console.error(chalk.red(`Error initializing ${PROVIDERS[provider]?.name}: ${err.message}`));
    process.exit(1);
  }

  // ── 2. Load project context (defaults to my_project_context.json) ──
  let context = {};
  const ctxPath = path.resolve(options.context || 'my_project_context.json');

  if (!fs.existsSync(ctxPath)) {
    context = {};
  } else {
    try {
      context = JSON.parse(fs.readFileSync(ctxPath, 'utf-8'));
    } catch (e) {
      console.error(chalk.red(`\nError: Cannot parse context file: ${e.message}`));
      process.exit(1);
    }
  }

  // ── 2a. If context lacks project_name, collect data interactively ──
  const isEmpty = !context.project_name || String(context.project_name).trim() === '';
  if (isEmpty) {
    context = await fillContextInteractively(ctxPath, context);
  }

  if (options.prompt) {
    context.scope = options.prompt;
  }

  const projectName = options.name || context.project_name || 'BABOK Analysis';
  const language = (options.lang || options.language || context.language || 'EN').toUpperCase();
  const outputDir = path.resolve(options.output || 'BABOK_Analysis');

  // Stage filtering
  let stagesToRun = [1, 2, 3, 4, 5, 6, 7, 8];
  if (options.stages) {
    stagesToRun = String(options.stages)
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => n >= 1 && n <= 8)
      .sort((a, b) => a - b);
  }

  // ── 3. Create project directory & journal ──
  const projectId = generateProjectIdWithTitle(projectName);
  const projectDir = path.join(outputDir, projectId);
  fs.mkdirSync(projectDir, { recursive: true });

  const journal = createRunJournal(projectId, projectName, language, projectDir);

  // ── 4. Print header ──
  console.log('');
  const isAuto = !!options.auto;
  const pipelineTitle = isAuto
    ? '║   BABOK Analysis Pipeline  [AUTO]    ║'
    : '║   BABOK Analysis Pipeline [INTERAK]  ║';
  console.log(chalk.bold.blue('╔══════════════════════════════════════╗'));
  console.log(chalk.bold.blue(pipelineTitle));
  console.log(chalk.bold.blue('╚══════════════════════════════════════╝'));
  console.log('');
  console.log(chalk.cyan('  Project : ') + chalk.bold(projectName));
  console.log(chalk.cyan('  ID      : ') + chalk.bold(projectId));
  console.log(chalk.cyan('  Language: ') + chalk.bold(language));
  console.log(chalk.cyan('  Output  : ') + chalk.dim(projectDir));
  console.log(chalk.cyan('  Provider: ') + chalk.magenta(PROVIDERS[provider]?.name || provider));
  console.log(chalk.cyan('  Model   : ') + chalk.dim(modelName));
  console.log(chalk.cyan('  Stages  : ') + chalk.dim(stagesToRun.join(', ')));
  if (provider === 'huggingface') {
    console.log('');
    console.log(chalk.yellow('  Uwaga: modele HuggingFace moga byc wolne (2-5 min/etap).'));
    console.log(chalk.dim('  Szybsze opcje: --provider gemini  lub  --provider openai'));
  }
  console.log(chalk.dim(line()));
  console.log('');

  // ── 5. Load main system prompt once ──
  const mainPrompt = loadMainSystemPrompt();
  const previousOutputs = {};

  // ── 6. Interactive readline (used when not --auto) ──
  let stageRl = null;
  let stageAsk = null;
  if (!isAuto) {
    stageRl = readline.createInterface({ input: process.stdin, output: process.stdout });
    stageAsk = (q) => new Promise(resolve => stageRl.question(q, a => resolve(a.trim())));
    console.log(chalk.dim('  Tryb interaktywny: podaj wkład → przejrzyj → zatwierdź każdy etap.'));
    console.log(chalk.dim('  Pomiń etap: naciśnij Enter bez wpisywania tekstu.'));
    console.log(chalk.dim('  q = wyjdź, n = wygeneruj ponownie z uwagami'));
    console.log('');
  }

  // ── 7. Run each stage ──
  for (const stageNum of stagesToRun) {
    const stageMeta = STAGES.find(s => s.stage === stageNum);
    const fileName = STAGE_FILE_NAMES[stageNum];
    const stagePromptContent = loadStagePrompt(stageNum);

    // Acquire stage lock (prevents concurrent edits in shared dirs)
    const lockResult = acquireLock(projectId, stageNum, projectDir);
    if (!lockResult.acquired) {
      console.error(chalk.red(
        `\n⛔ Stage ${stageNum} is locked by another user: ${formatLockInfo(lockResult.lock)}`
      ));
      console.error(chalk.dim(`   Lock file: ${projectDir}/.stage_${stageNum}.lock`));
      stageRl?.close();
      process.exit(1);
    }

    // ── 7a. Ask user for additional input (interactive mode) ──
    let extraInput = '';
    if (stageAsk) {
      console.log(chalk.bold.cyan(`  ┌── Etap ${stageNum}/8: ${stageMeta.name}`));
      console.log(chalk.dim('  │   Podaj dodatkowe informacje, wymagania lub wytyczne dla tego'));
      console.log(chalk.dim('  │   etapu. Naciśnij Enter, aby pominąć i użyć tylko kontekstu.'));
      extraInput = await stageAsk(chalk.cyan(`  └─ Twój wkład: `));
      console.log('');
    } else {
      console.log(chalk.cyan(`  [${stageNum}/8] ${stageMeta.name}`));
    }

    // ── 7b. Build system prompt and generate ──
    const buildUserMessage = (extra) => {
      let msg = language === 'PL'
        ? `Wygeneruj kompletny dokument dostarczany dla Etapu ${stageNum}: "${stageMeta.name}". ` +
          `Użyj dostarczonego kontekstu projektu i wygeneruj profesjonalny, kompleksowy dokument analizy biznesowej zgodny ze standardem BABOK v3.`
        : `Generate the complete deliverable document for Stage ${stageNum}: "${stageMeta.name}". ` +
          `Use the provided project context and generate a professional, comprehensive business analysis document following BABOK v3 standards.`;
      if (extra) {
        msg += language === 'PL'
          ? `\n\nDodatkowe informacje od analityka biznesowego:\n${extra}`
          : `\n\nAdditional input from the business analyst:\n${extra}`;
      }
      return msg;
    };

    const runGeneration = async (extra) => {
      const systemPrompt = buildStageSystemPrompt(
        mainPrompt, stagePromptContent, context, language, previousOutputs, stageNum
      );
      startChatSession(systemPrompt, []);
      process.stdout.write(chalk.dim('  Generating'));
      let dotCount = 0;
      try {
        const resp = await sendWithTimeout(buildUserMessage(extra), (_chunk) => {
          if (++dotCount % 15 === 0) process.stdout.write('.');
        });
        return { resp, systemPrompt };
      } catch (err) {
        console.error(chalk.red(`\n\n  Error in Stage ${stageNum}: ${err.message}`));
        if (/401|Unauthorized|CREDENTIALS_MISSING|API key not valid/i.test(err.message)) {
          console.error(chalk.yellow('\n  Wskazówka: klucz API jest nieprawidłowy lub wygasł.'));
          console.error(chalk.dim('  Uruchom ponownie i przy pytaniu "Uzyc zapisanego klucza?" wpisz n'));
          console.error(chalk.dim('  Nowy klucz Gemini: https://aistudio.google.com/app/apikey'));
        }
        stageRl?.close();
        process.exit(1);
      }
    };

    let { resp: response } = await runGeneration(extraInput);

    // ── 7c. Interactive: preview + approval loop ──
    if (stageAsk) {
      let approved = false;
      let currentExtra = extraInput;

      while (!approved) {
        // Show preview (first 35 lines)
        const allLines = response.split('\n');
        const preview = allLines.slice(0, 35);
        console.log('');
        console.log(chalk.dim('  ' + '─'.repeat(52)));
        console.log(chalk.bold('  Podgląd — ' + fileName + ':'));
        console.log('');
        preview.forEach(l => process.stdout.write('  ' + l + '\n'));
        if (allLines.length > 35) {
          console.log(chalk.dim(`  ... (${allLines.length - 35} linii więcej)`));
        }
        console.log(chalk.dim('  ' + '─'.repeat(52)));
        console.log('');

        const ans = await stageAsk(
          chalk.cyan('  Zatwierdź? (T=tak / n=popraw i wygeneruj ponownie / q=wyjdź): ')
        );

        if (!ans || ans.toUpperCase() === 'T' || ans.toUpperCase() === 'TAK') {
          console.log(chalk.green('  ✓ Etap zatwierdzony\n'));
          approved = true;
        } else if (ans.toLowerCase() === 'q') {
          stageRl.close();
          console.log(chalk.yellow('\n  Przerwano przez użytkownika.'));
          process.exit(0);
        } else {
          const feedback = await stageAsk(chalk.cyan('  Uwagi do poprawki (opcjonalnie, Enter=bez uwag): '));
          currentExtra = [currentExtra, feedback].filter(Boolean).join('\n');
          console.log('');
          const result = await runGeneration(currentExtra);
          response = result.resp;
        }
      }
    } else {
      console.log(chalk.green(` ✓`));
    }

    const filePath = path.join(projectDir, fileName);

    // ── 7b-debate: Multi-perspective debate (--debate flag, deep stages only) ──
    if (options.debate) {
      const llmClient = {
        chat: async (systemPrompt, userMessage) => {
          startChatSession(systemPrompt, []);
          return sendWithTimeout(userMessage, null);
        },
      };
      const debateResult = await runDebate(stageNum, context, llmClient, { model: modelName });
      if (debateResult) {
        console.log(chalk.magenta(`  [debate] Stage ${stageNum} debate complete (${debateResult.metadata.latencyMs}ms)`));
        response = debateResult.synthesis;
        markDebateInJournal(journal, stageNum, debateResult.metadata, projectDir);
      }
    }

    // ── 7b-verify: Chain-of-Verification (--verify flag, all stages) ──
    if (options.verify) {
      const llmClient = {
        chat: async (systemPrompt, userMessage) => {
          startChatSession(systemPrompt, []);
          return sendWithTimeout(userMessage, null);
        },
      };
      const { corrected, verificationReport } = await runCoVe(
        stageNum, response, context, llmClient, { projectDir }
      );
      console.log(chalk.blue(
        `  [verify] Stage ${stageNum}: ${verificationReport.questionsTotal} checks, ` +
        `${verificationReport.refutedCount} refuted`
      ));
      response = corrected;
    }

    fs.writeFileSync(filePath, response, 'utf-8');
    previousOutputs[stageNum] = response;
    updateJournalStage(journal, stageNum, projectDir, fileName);

    // Release lock for this stage
    releaseLock(projectId, stageNum, projectDir);
  }

  stageRl?.close();

  // ── 7. Generate FINAL doc (only when all 8 stages ran) ──
  if (stagesToRun.length === 8) {
    process.stdout.write(chalk.cyan('\n  Merging FINAL_Complete_Documentation.md...'));
    const finalContent = buildFinalDocument(projectName, projectId, previousOutputs, language);
    fs.writeFileSync(path.join(projectDir, 'FINAL_Complete_Documentation.md'), finalContent, 'utf-8');
    console.log(chalk.green(' ✓'));
  }

  // ── 8. Summary ──
  console.log('');
  console.log(chalk.dim(line()));
  console.log(chalk.bold.green('  ✅ Analysis Complete!'));
  console.log(chalk.dim(line()));
  console.log('');
  console.log(chalk.white('  Files generated:'));
  for (const n of stagesToRun) {
    console.log(chalk.dim(`    • ${STAGE_FILE_NAMES[n]}`));
  }
  if (stagesToRun.length === 8) {
    console.log(chalk.dim('    • FINAL_Complete_Documentation.md'));
  }
  console.log(chalk.dim(`    • PROJECT_JOURNAL_${projectId}.json`));
  console.log('');
  console.log(chalk.white('  Output directory:'));
  console.log(chalk.cyan(`    ${projectDir}`));
  console.log('');
  console.log(chalk.white('  Next steps:'));
  console.log(chalk.dim(`    babok make docx ${projectId}   → export DOCX`));
  console.log(chalk.dim(`    babok make pdf  ${projectId}   → export PDF`));
  console.log(chalk.dim(`    babok status    ${projectId}   → view status`));
  console.log('');
}
