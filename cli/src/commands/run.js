import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { generateProjectId } from '../project.js';
import { getProjectDir } from '../project.js';
import { DEFAULT_PROFILE_ID, getStageFileNames, listProfileIds, loadProfile } from '../profiles.js';
import { acquireLock, releaseLock, formatLockInfo } from '../lock.js';
import {
  getApiKey,
  initializeProvider,
  createLlmClient,
  getRateLimitRetryDelayMs,
  PROVIDERS,
  promptForProvider,
  listStoredProviders,
} from '../llm.js';
import { runPipeline } from '../orchestrator/engine.js';
import { writeContext } from '../orchestrator/context-manager.js';
import { createJournal } from '../journal.js';
import { loadRubric } from '../templates.js';
import { createTaskRouter } from '../router.js';
import { generateStagedDeliverable } from '../generation/staged-generator.js';
import { buildStageSystemPromptBase } from '../generation/prompt-builder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Stage → output file name mapping and stage names come from the active profile
// (profiles/<id>/profile.json). Templates loaded via <templates_dir>/manifest.json.

/** Resolve a profile id, exiting with the available list on error. */
function loadProfileOrExit(profileId) {
  try {
    return loadProfile(profileId);
  } catch {
    console.error(chalk.red(`Error: Unknown profile "${profileId}". Available: ${listProfileIds().join(', ')}`));
    process.exit(1);
  }
}

/**
 * Ask which pipeline profile to use (numbered menu, same style as the provider picker).
 * Skipped entirely when only one profile is installed.
 * @param {string} defaultId
 * @returns {Promise<string>}
 */
async function promptForProfile(defaultId) {
  const ids = listProfileIds();
  if (ids.length <= 1) return ids[0] ?? defaultId;

  console.log('');
  console.log(chalk.bold.yellow('  Profil analizy / Pipeline profile'));
  console.log(chalk.dim('  ──────────────────────────────────────────────'));
  console.log('');
  const defaultIndex = Math.max(1, ids.indexOf(defaultId) + 1);
  ids.forEach((id, i) => {
    const p = loadProfile(id);
    const marker = id === defaultId ? chalk.dim('  <domyslny>') : '';
    console.log(`    ${i + 1}. ${chalk.bold(id)} — ${p.name}${marker}`);
  });
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve =>
    rl.question(chalk.cyan(`  Numer profilu [${defaultIndex}]: `), a => { rl.close(); resolve(a.trim()); })
  );

  const idx = answer === '' ? defaultIndex - 1 : parseInt(answer, 10) - 1;
  return ids[idx] ?? defaultId;
}

/**
 * Resolve the profile for this run: explicit --profile always wins; otherwise --auto
 * reuses the context's stored profile (or the default) silently, and interactive runs
 * prompt with the same numbered-menu UX as provider selection. The choice is written
 * back into `context.profile` so subsequent bare `babok run` calls remember it.
 * @param {object} options
 * @param {object} context
 * @returns {Promise<object>} loaded profile
 */
async function resolveRunProfile(options, context) {
  if (options.profile) {
    const profile = loadProfileOrExit(options.profile);
    context.profile = profile.id;
    return profile;
  }

  const storedId = context.profile && listProfileIds().includes(context.profile)
    ? context.profile
    : DEFAULT_PROFILE_ID;

  const chosenId = options.auto ? storedId : await promptForProfile(storedId);
  const profile = loadProfileOrExit(chosenId);
  context.profile = profile.id;
  return profile;
}

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

/** Generate project ID with title slug: <PREFIX>-TITLE-YYYYMMDD-XXXX */
function generateProjectIdWithTitle(projectName, profile) {
  const base = generateProjectId(profile); // "<PREFIX>-YYYYMMDD-XXXX"
  const slug = slugify(projectName);
  const prefix = `${profile.id_prefix}-`;
  return slug ? base.replace(prefix, `${prefix}${slug}-`) : base;
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

function createRunJournal(projectId, projectName, language, projectDir, profile, stagesToRun) {
  const now = new Date().toISOString();
  const firstStage = stagesToRun[0];
  const journal = {
    project_id: projectId,
    project_name: projectName,
    profile: profile.id,
    language,
    created_at: now,
    last_updated: now,
    current_stage: firstStage,
    current_status: 'in_progress',
    run_mode: 'automated',
    stages: profile.stages.map(s => ({
      stage: s.stage,
      name: s.name,
      status: s.stage === firstStage ? 'in_progress' : 'not_started',
      started_at: s.stage === firstStage ? now : null,
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

function updateJournalStage(journal, stageNum, projectDir, fileName, extra = {}) {
  const now = new Date().toISOString();
  const stage = journal.stages.find(s => s.stage === stageNum);
  if (stage) {
    stage.status = 'approved';
    stage.completed_at = now;
    stage.approved_at = now;
    stage.approved_by = 'auto-run';
    stage.deliverable_file = fileName;
    Object.assign(stage, extra);
  }
  const nextStage = journal.stages.find(s => s.stage === stageNum + 1);
  if (nextStage && nextStage.status === 'not_started') {
    nextStage.status = 'in_progress';
    nextStage.started_at = now;
    journal.current_stage = stageNum + 1;
  }
  if (!nextStage) {
    journal.current_status = 'completed';
  }
  journal.last_updated = now;
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${journal.project_id}.json`);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
}

export function buildPreviousOutputsContext(previousOutputs, profile) {
  if (Object.keys(previousOutputs).length === 0) return '';
  const parts = Object.entries(previousOutputs).map(([n, content]) => {
    const meta = profile.stages.find(stage => stage.stage === Number(n));
    return `--- Stage ${n}: ${meta?.name} ---\n${content}`;
  });
  return `\n\n=== PREVIOUS STAGE OUTPUTS (source context) ===\n${parts.join('\n\n')}\n=== END PREVIOUS OUTPUTS ===`;
}

function buildFinalDocument(projectName, projectId, outputs, language, profile) {
  const now = new Date().toISOString().split('T')[0];

  const header = language === 'PL'
    ? `# Kompletna Dokumentacja Analizy BABOK\n\n**Projekt:** ${projectName}  \n**ID:** ${projectId}  \n**Data wygenerowania:** ${now}  \n**Tryb:** Automatyczny (auto-run)  \n**Status:** Kompletny  \n\n`
    : `# Complete BABOK Analysis Documentation\n\n**Project:** ${projectName}  \n**ID:** ${projectId}  \n**Generated:** ${now}  \n**Mode:** Automated (auto-run)  \n**Status:** Complete  \n\n`;

  const tocLabel = language === 'PL' ? '## Spis treści\n\n' : '## Table of Contents\n\n';
  const toc = tocLabel + Object.entries(outputs)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([n]) => {
      const meta = profile.stages.find(s => s.stage === parseInt(n));
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

function formatLlmError(error) {
  const details = [error?.message];
  let cause = error?.cause;
  while (cause) {
    details.push(cause.message || cause.code);
    cause = cause.cause;
  }
  return [...new Set(details.filter(Boolean))].join(' -> ');
}


// ──────────────────────────────────────────────
//  Main command
// ──────────────────────────────────────────────

export async function runAnalysis(options) {
  // ── 0. Load project context early so the profile prompt can remember the last choice ──
  const ctxPath = path.resolve(options.context || 'my_project_context.json');
  let context = {};
  if (fs.existsSync(ctxPath)) {
    try {
      context = JSON.parse(fs.readFileSync(ctxPath, 'utf-8'));
    } catch (e) {
      console.error(chalk.red(`\nError: Cannot parse context file: ${e.message}`));
      process.exit(1);
    }
  }
  // Strip legacy/administrative keys (schema_version 2.0 nested `project.*`, orchestrator
  // bookkeeping) that no code here reads but that would otherwise be dumped verbatim into
  // the LLM prompt alongside the flat fields below, confusing the model with stale data
  // from a previous run.
  for (const legacyKey of ['project', 'schema_version', 'stages', 'quality_reports', 'agent_messages']) {
    delete context[legacyKey];
  }

  const profile = await resolveRunProfile(options, context);
  fs.mkdirSync(path.dirname(ctxPath), { recursive: true });
  fs.writeFileSync(ctxPath, JSON.stringify(context, null, 2), 'utf-8');
  const STAGE_FILE_NAMES = getStageFileNames(profile);
  const scorableStages = profile.scoring.scorable_stages;
  const deepStagesLabel = profile.orchestrator.deep_analysis_stages.join(',');

  // ── --orchestrate: delegate to the automated multi-stage pipeline engine ──
  if (options.orchestrate) {
    const projectName = options.name || 'Orchestrated Project';
    const projectId = generateProjectIdWithTitle(projectName, profile);
    const projectDir = getProjectDir(projectId);
    fs.mkdirSync(projectDir, { recursive: true });
    writeContext(projectId, { projectName, profile: profile.id, startedAt: new Date().toISOString() });
    // A real Two-Key-gated journal is required so orchestrator output can later be
    // approved via `babok approve` — without this, stages had nowhere to record
    // status/deliverable_file and could never be approved.
    createJournal(projectId, projectName, options.lang || options.language || 'EN', profile.id);

    console.log('');
    console.log(chalk.bold.blue('╔═════════════════════════════════════╗'));
    console.log(chalk.bold.blue('║   BABOK Orchestrator Engine [AUTO]   ║'));
    console.log(chalk.bold.blue('╚═════════════════════════════════════╝'));
    console.log('');
    console.log(chalk.cyan('  Project : ') + chalk.bold(projectName));
    console.log(chalk.cyan('  ID      : ') + chalk.bold(projectId));
    console.log(chalk.cyan('  Profile : ') + chalk.bold(profile.id));
    console.log(chalk.cyan('  Output  : ') + chalk.dim(projectDir));
    console.log('');

    // ── Provider selection for orchestrator ──
    let orchProvider = options.provider || null;
    let orchApiKey = null;
    let orchModel = options.model || null;

    if (orchProvider && PROVIDERS[orchProvider]) {
      orchApiKey = getApiKey(orchProvider);
      if (!orchApiKey) {
        console.error(chalk.red(`\nError: No API key found for provider: ${orchProvider}`));
        console.error(chalk.dim(`  Set ${PROVIDERS[orchProvider].envKey} in .env  or run: babok llm key`));
        process.exit(1);
      }
    } else {
      try {
        const sel = await promptForProvider();
        orchProvider = sel.provider;
        orchApiKey = sel.apiKey;
        if (!orchModel) orchModel = sel.model;
      } catch (err) {
        console.error(chalk.red(`\n${err.message}`));
        process.exit(1);
      }
    }
    if (!orchModel) orchModel = PROVIDERS[orchProvider]?.defaultModel;

    const llmClient = createLlmClient(orchProvider, orchApiKey, orchModel);
    console.log(chalk.cyan('  Provider  : ') + chalk.bold(`${llmClient.providerName} / ${llmClient.modelName}`));

    // ── Deep analysis client for the profile's deep-analysis stages ──
    let deepAnalysisClient = llmClient;
    if (options.deepModel) {
      deepAnalysisClient = createLlmClient(orchProvider, orchApiKey, options.deepModel);
      console.log(chalk.cyan('  Deep model: ') + chalk.bold(options.deepModel) + chalk.dim(`  (stages ${deepStagesLabel})`));
    }

    const taskRouter = createTaskRouter({
      primaryProvider: orchProvider,
      primaryApiKey: orchApiKey,
      primaryModel: orchModel,
      deepProvider: orchProvider,
      deepApiKey: orchApiKey,
      deepModel: options.deepModel || orchModel,
    });
    console.log('');

    const result = await runPipeline(projectId, {
      dryRun: false,
      profile,
      llmClient,
      deepAnalysisClient,
      taskRouter,
      onProgress: (e) => {
        const modeTag = e.mode === 'deep_analysis' ? chalk.magenta(' [DEEP]') : '';
        console.log(chalk.cyan('  [orchestrator]'), e.type, e.stage || '', modeTag);
      },
    });
    console.log(chalk.green('\n  ✅ Pipeline complete!'), result.stagesCompleted.length, 'stages');
    if (result.stagesFailed.length > 0) {
      console.log(chalk.yellow('  ⚠️  Failed stages:'), result.stagesFailed.join(', '));
    }
    return;
  }

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

  // ── 2. Context was already loaded in step 0; collect data interactively if empty ──
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

  const taskRouter = createTaskRouter({
    primaryProvider: provider,
    primaryApiKey: apiKey,
    primaryModel: modelName,
    deepProvider: provider,
    deepApiKey: apiKey,
    deepModel: options.deepModel || modelName,
  });

  // Stage filtering
  let stagesToRun = [...scorableStages];
  if (options.stages) {
    stagesToRun = String(options.stages)
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => scorableStages.includes(n))
      .sort((a, b) => a - b);
  }

  // ── 3. Create project directory & journal ──
  const projectId = generateProjectIdWithTitle(projectName, profile);
  const projectDir = path.join(outputDir, projectId);
  fs.mkdirSync(projectDir, { recursive: true });

  const journal = createRunJournal(projectId, projectName, language, projectDir, profile, stagesToRun);

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
  console.log(chalk.cyan('  Profile : ') + chalk.bold(profile.id));
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

  // ── 5. Load the rubric once (per-stage generation_batches / weights) ──
  const rubric = loadRubric(profile);
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
    const stageMeta = profile.stages.find(s => s.stage === stageNum);
    const fileName = STAGE_FILE_NAMES[stageNum];
    const stageRubric = rubric.stages[`stage${stageNum}`];
    const isDeepStage = profile.orchestrator.deep_analysis_stages.includes(stageNum);
    const stageClient = taskRouter.getStageClient(stageNum);

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

    // Build the complete prompt and generate the document in one request.
    const userMessageIntro = language === 'PL'
      ? `Wygeneruj kompletny dokument dostarczany dla Etapu ${stageNum}: "${stageMeta.name}". ` +
        `Użyj dostarczonego kontekstu projektu i wygeneruj profesjonalny, kompleksowy dokument analizy biznesowej zgodny ze standardem BABOK v3.`
      : `Generate the complete deliverable document for Stage ${stageNum}: "${stageMeta.name}". ` +
        `Use the provided project context and generate a professional, comprehensive business analysis document following BABOK v3 standards.`;

    // One complete generation request, including any requested diagram.
    const stageTimeoutMinutes = 10;
    const stageTimeoutMs = stageTimeoutMinutes * 60 * 1000;

    const runGeneration = async (extra) => {
      process.stdout.write(chalk.dim('\n  Preparing stage context...'));
      const prevContext = buildPreviousOutputsContext(previousOutputs, profile);
      const systemPromptBase = buildStageSystemPromptBase(profile, stageNum, context, language, { prevContext });
      let userMessageWithExtra = extra
        ? `${userMessageIntro}\n\n${language === 'PL' ? 'Dodatkowe informacje od analityka biznesowego:' : 'Additional input from the business analyst:'}\n${extra}`
        : userMessageIntro;
      if (options.diagram && (stageNum === 2 || stageNum === 5)) {
        userMessageWithExtra += '\nInclude a process diagram in a fenced mermaid block, grounded in the same document.';
      }

      process.stdout.write(chalk.dim('  Generating'));
      let lastChunkPrint = 0;
      let stageTimer;
      let rateLimitRetried = false;
      const startedAt = Date.now();
      const heartbeat = setInterval(() => {
        process.stdout.write(chalk.dim(` [${Math.round((Date.now() - startedAt) / 1000)}s]`));
      }, 15000);
      heartbeat.unref();
      try {
        const generation = await Promise.race([
          generateStagedDeliverable({
            stageNumber: stageNum,
            profile,
            llmClient: stageClient,
            systemPromptBase,
            userMessageIntro: userMessageWithExtra,
            context,
            rubric,
            stageRubric,
            batchGroups: stageRubric.generation_batches,
            isDeepStage,
            projectDir,
            options: {
              model: stageClient.modelName,
              classifyVerdict: taskRouter.classifyVerdict,
              onProgress: (event) => {
                if (event.type === 'draft_started') {
                  process.stdout.write(chalk.dim(' document... '));
                } else if (event.type === 'local_scoring') {
                  process.stdout.write(chalk.dim(' -> local validation'));
                } else if (event.type === 'chunk') {
                  const now = Date.now();
                  if (now - lastChunkPrint > 400) {
                    process.stdout.write(chalk.dim('.'));
                    lastChunkPrint = now;
                  }
                } else if (event.type === 'generation_complete') {
                  process.stdout.write(chalk.dim(` -> score ${event.score}`));
                  if (!event.passed) process.stdout.write(chalk.yellow(' (requires review)'));
                }
              },
            },
          }),
          new Promise((_, reject) => {
            stageTimer = setTimeout(() => reject(new Error(
              `Timeout: Stage ${stageNum} did not complete after ${stageTimeoutMinutes} minutes.\n` +
              `  Tip: try a smaller/faster model with --model, e.g.:\n` +
              `    babok run --provider gemini --model gemini-2.0-flash\n` +
              `    babok run --provider openai --model gpt-5.4-mini`
            )), stageTimeoutMs);
          }),
        ]);
        return { resp: generation.finalDocument, generation };
      } catch (err) {
        const retryDelayMs = getRateLimitRetryDelayMs(err);
        if (retryDelayMs !== null && !rateLimitRetried) {
          rateLimitRetried = true;
          console.error(chalk.yellow(
            `\n\n  Limit TPM dostawcy. Ponawiam etap za ${(retryDelayMs / 1000).toFixed(1)} s...`
          ));
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        console.error(chalk.red(`\n\n  Error in Stage ${stageNum}: ${formatLlmError(err)}`));
        if (/401|Unauthorized|CREDENTIALS_MISSING|API key not valid/i.test(err.message)) {
          console.error(chalk.yellow('\n  Wskazówka: klucz API jest nieprawidłowy lub wygasł.'));
          console.error(chalk.dim('  Uruchom ponownie i przy pytaniu "Uzyc zapisanego klucza?" wpisz n'));
          console.error(chalk.dim('  Nowy klucz Gemini: https://aistudio.google.com/app/apikey'));
        }
        releaseLock(projectId, stageNum, projectDir);
        stageRl?.close();
        process.exit(1);
      } finally {
        clearTimeout(stageTimer);
        clearInterval(heartbeat);
      }
    };

    let { resp: response, generation } = await runGeneration(extraInput);

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
          releaseLock(projectId, stageNum, projectDir);
          stageRl.close();
          console.log(chalk.yellow('\n  Przerwano przez użytkownika.'));
          process.exit(0);
        } else {
          const feedback = await stageAsk(chalk.cyan('  Uwagi do poprawki (opcjonalnie, Enter=bez uwag): '));
          currentExtra = [currentExtra, feedback].filter(Boolean).join('\n');
          console.log('');
          const result = await runGeneration(currentExtra);
          response = result.resp;
          generation = result.generation;
        }
      }
    } else {
      console.log(chalk.green(` ✓`));
    }

    const filePath = path.join(projectDir, fileName);

    if (options.debate || options.verify) {
      console.log(chalk.dim('  --debate/--verify: drafting uses one request with local validation.'));
    }

    fs.writeFileSync(filePath, response, 'utf-8');
    previousOutputs[stageNum] = response;
    updateJournalStage(journal, stageNum, projectDir, fileName, {
      generation_batches_used: generation.batches,
      final_pass_mode: generation.finalPass.mode,
      ...(generation.finalPass.mode === 'debate_verify' ? {
        debate_used: !!generation.finalPass.debateMetadata,
        debate_metadata: generation.finalPass.debateMetadata,
        verification_report_summary: generation.finalPass.verificationReport ? {
          questionsTotal: generation.finalPass.verificationReport.questionsTotal,
          refutedCount: generation.finalPass.verificationReport.refutedCount,
        } : null,
      } : {}),
    });

    // Release lock for this stage
    releaseLock(projectId, stageNum, projectDir);
  }

  stageRl?.close();

  // ── 7. Generate FINAL doc (only when every deliverable stage ran) ──
  const ranAll = stagesToRun.length === scorableStages.length;
  if (ranAll) {
    process.stdout.write(chalk.cyan('\n  Merging FINAL_Complete_Documentation.md...'));
    const finalContent = buildFinalDocument(projectName, projectId, previousOutputs, language, profile);
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
  if (ranAll) {
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
