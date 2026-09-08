import chalk from 'chalk';
import readline from 'readline';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal, writeJournal, guardSaveDeliverable, submitForReview } from '../journal.js';
import { sha256Content } from '../two-key-gate.js';
import { getMaxStage, getStageFileNames, loadProfile } from '../profiles.js';
import { loadRubric } from '../templates.js';
import { header, keyValue, line } from '../display.js';
import { 
  cancelActiveLlmRequests,
  PROVIDERS,
  initializeProvider, 
  startChatSession, 
  clearChatHistory,
  sendMessageStream, 
  getActiveProviderInfo,
  loadStagePrompt,
  loadMainSystemPrompt,
  getApiKey,
  promptForProvider,
  clearStoredKey,
  discoverProviderModels,
  listStoredProviders,
} from '../llm.js';
import fs from 'fs';
import path from 'path';
import { withStageLock } from '../lock.js';
import { runDebate } from '../reasoning/debate.js';
import { generateStagedDeliverable } from '../generation/staged-generator.js';
import { buildStageSystemPromptBase } from '../generation/prompt-builder.js';
import { summarizeConversationHistory } from '../context-window.js';

/**
 * Interactive chat command for BABOK stages
 * Usage: babok chat <project_id> [--provider gemini] [--stage 1] [--model name]
 */
export async function chatCommand(partialId, options) {
  // Resolve project ID
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok chat <project_id> [stage]'
    ));
    process.exit(1);
  }

  // Read journal
  let journal;
  try {
    journal = readJournal(projectId);
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }

  // Determine stage
  const profile = loadProfile(journal.profile);
  const maxStage = getMaxStage(profile);
  let stageNumber = options.stage ? parseInt(options.stage) : journal.current_stage;
  if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > maxStage) {
    console.error(chalk.red(`Error: Stage must be a number between 1 and ${maxStage}`));
    process.exit(1);
  }

  let currentStage = stageNumber;
  const getStageName = (stage) => journal.stages.find(s => s.stage === stage)?.name || `Stage ${stage}`;

  // ── Provider & API Key selection ──
  let provider = options.provider || null;
  let apiKey = null;
  let modelName = options.model || null;

  if (provider && PROVIDERS[provider]) {
    // Provider specified via --provider flag
    apiKey = getApiKey(provider);
    if (!apiKey) {
      // Key missing for specifically requested provider -> prompt for just that key
      try {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const { promptForKeyOnly } = await import('../llm.js');
        const result = await promptForKeyOnly(provider, rl);
        apiKey = result.apiKey;
        rl.close();
      } catch (err) {
        console.error(chalk.red(`\n${err.message}`));
        process.exit(1);
      }
    }
  } else {
    // Auto-detect: check if any provider has a key, otherwise prompt
    const stored = listStoredProviders();
    if (stored.length === 1) {
      provider = stored[0];
      apiKey = getApiKey(provider);
    } else if (stored.length > 1 || !provider) {
      // Multiple keys or none → interactive selection
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
  }

  if (!modelName) {
    modelName = PROVIDERS[provider]?.defaultModel;
  }

  // Print header
  console.log('');
  console.log(chalk.bold.blue('🤖 BABOK Agent Chat'));
  console.log(chalk.dim(line()));
  keyValue('Project:', chalk.bold(projectId));
  keyValue('Stage:', chalk.cyan(`${currentStage} - ${getStageName(currentStage)}`));
  keyValue('Provider:', chalk.magenta(PROVIDERS[provider]?.name || provider));
  keyValue('Model:', chalk.dim(modelName));
  keyValue('API Key:', chalk.dim('●●●●●●●●' + apiKey.slice(-4)));
  console.log(chalk.dim(line()));
  console.log('');
  console.log(chalk.dim('Type your message and press Enter. Commands:'));
  console.log(chalk.dim('  /exit or /quit  - End chat session'));
  console.log(chalk.dim('  /save           - Save conversation to project'));
  console.log(chalk.dim('  /clear          - Clear conversation history'));
  console.log(chalk.dim('  /stage N        - Switch to stage N'));
  console.log(chalk.dim('  /key            - Change API key'));
  console.log(chalk.dim('  /key clear      - Remove stored API key(s)'));
  console.log(chalk.dim('  /help           - Show commands'));
  console.log(chalk.dim(line()));
  console.log('');

  // Initialize provider
  try {
    await initializeProvider(provider, apiKey, modelName);
  } catch (err) {
    console.error(chalk.red(`Error initializing ${PROVIDERS[provider]?.name}: ${err.message}`));
    process.exit(1);
  }

  // Build context prompt
  const conversationState = loadConversationState(projectId, currentStage);
  const systemPrompt = buildContextPrompt(journal, currentStage, conversationState.summary);
  
  // Start chat session
  startChatSession(systemPrompt, conversationState.recentMessages);

  // Track messages for saving
  const messages = [...conversationState.allMessages];
  let messageCount = 0;

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let isShuttingDown = false;
  let interrupted = false;
  const signalHandler = () => {
    const cancelled = cancelActiveLlmRequests();
    if (cancelled > 0 && !interrupted) {
      interrupted = true;
      console.log(chalk.yellow('\n⏹  Cancelled active LLM request. Press Ctrl+C again to exit chat.'));
      return;
    }
    isShuttingDown = true;
    persistConversationState(projectId, currentStage, messages)
      .finally(() => process.exit(130));
  };
  process.on('SIGINT', signalHandler);
  process.on('SIGTERM', signalHandler);

  // Set up prompt
  const prompt = () => {
    rl.question(chalk.green('\n👤 You: '), async (input) => {
      const trimmed = input.trim();
      
      if (!trimmed) {
        prompt();
        return;
      }

      // Handle commands
      if (trimmed.startsWith('/')) {
        const handled = await handleCommand(trimmed, rl, projectId, currentStage, messages, journal);
        if (handled?.type === 'exit') {
          return;
        }
        if (handled?.type === 'stage_changed') {
          const nextStage = await switchChatStage(projectId, journal, currentStage, handled.stageNumber, messages);
          currentStage = nextStage.stageNumber;
          startChatSession(nextStage.systemPrompt, nextStage.recentMessages);
          messages.length = 0;
          messages.push(...nextStage.messages);
          console.log(chalk.green(`\n✓ Switched to Stage ${currentStage}`));
        }
        prompt();
        return;
      }

      // Send message to AI
      const { name: providerName } = getActiveProviderInfo();
      console.log(chalk.blue(`\n🤖 BABOK Agent (${providerName}): `));
      
      try {
        interrupted = false;
        let response = await sendMessageStream(trimmed, (chunk) => {
          process.stdout.write(chunk);
        }, { requestLabel: `Chat stage ${currentStage}` });
        console.log(''); // New line after response

        // ── Debate pass (--debate flag, deep-analysis stages only) ──
        if (options.debate) {
          console.log(chalk.magenta('\n[debate] analyst → critic → synthesiser...'));
          const llmClientForDebate = {
            chat: async (systemPrompt, userMessage) => {
              startChatSession(systemPrompt, []);
              return sendMessageStream(userMessage, null, { requestLabel: `Debate stage ${currentStage}` });
            },
          };
          const contextForDebate = { stage: currentStage, journal_summary: journal.project_name };
          const debateResult = await runDebate(currentStage, contextForDebate, llmClientForDebate, {});
          if (debateResult) {
            console.log(chalk.magenta('\n[debate] Synthesised response:'));
            console.log(debateResult.synthesis);
            response = debateResult.synthesis;
          }
        }

        // Track messages
        messages.push({ role: 'user', parts: [{ text: trimmed }] });
        messages.push({ role: 'model', parts: [{ text: response }] });
        messageCount++;

        // Auto-save every 5 messages
        if (messageCount % 5 === 0) {
          await persistConversationState(projectId, currentStage, messages);
          console.log(chalk.dim('  [auto-saved]'));
        }

      } catch (err) {
        console.error(chalk.red(`\nError: ${err.message}`));
      }

      prompt();
    });
  };

  // Handle readline close
  rl.on('close', () => {
    if (isShuttingDown) {
      process.off('SIGINT', signalHandler);
      process.off('SIGTERM', signalHandler);
      process.exit(0);
    }
    console.log(chalk.yellow('\n\n📁 Saving conversation...'));
    persistConversationState(projectId, currentStage, messages)
      .then(() => {
        console.log(chalk.green('✓ Conversation saved. Goodbye!'));
        process.off('SIGINT', signalHandler);
        process.off('SIGTERM', signalHandler);
        process.exit(0);
      })
      .catch((err) => {
        console.error(chalk.red(`Could not save conversation: ${err.message}`));
        process.off('SIGINT', signalHandler);
        process.off('SIGTERM', signalHandler);
        process.exit(1);
      });
  });

  // Start prompting
  console.log(chalk.cyan('💬 Start chatting with BABOK Agent...'));
  prompt();
}

/**
 * Build context prompt with project info
 */
function buildContextPrompt(journal, stageNumber, historySummary = '') {
  const profile = loadProfile(journal.profile);
  const mainPrompt = loadMainSystemPrompt(profile);
  const stagePrompt = loadStagePrompt(stageNumber, profile);
  
  const stageName = journal.stages.find(s => s.stage === stageNumber)?.name || `Stage ${stageNumber}`;
  const stageInfo = journal.stages.find(s => s.stage === stageNumber);
  
  let contextBlock = `
=== PROJECT CONTEXT ===
Project ID: ${journal.project_id}
Project Name: ${journal.project_name}
Language: ${journal.language || 'EN'} ${journal.language === 'PL' ? '(Polski - use Polish language for all responses)' : '(English - use English language for all responses)'}
Created: ${journal.created_at}

Current Stage: ${stageNumber} - ${stageName}
Stage Status: ${stageInfo?.status || 'unknown'}
${stageInfo?.notes ? `Stage Notes: ${stageInfo.notes}` : ''}

Completed Stages:
${journal.stages.filter(s => s.status === 'approved').map(s => `  ✓ Stage ${s.stage}: ${s.name}`).join('\n') || '  (none yet)'}

Key Decisions:
${journal.decisions.map(d => `  - ${d.description}`).join('\n') || '  (none yet)'}

Assumptions:
${journal.assumptions.map(a => `  - ${a}`).join('\n') || '  (none yet)'}

Open Questions:
${journal.open_questions.map(q => `  - ${q}`).join('\n') || '  (none yet)'}

${historySummary ? `Earlier Conversation Summary:\n${historySummary}\n\n` : ''}
LANGUAGE INSTRUCTION: You MUST respond in ${journal.language === 'PL' ? 'POLISH' : 'ENGLISH'} language throughout this entire conversation.
======================

`;

  return mainPrompt + '\n\n' + stagePrompt + '\n\n' + contextBlock;
}

/**
 * Handle slash commands
 */
async function handleCommand(command, rl, projectId, stageNumber, messages, journal) {
  const [cmd, ...args] = command.toLowerCase().split(' ');
  const maxStage = getMaxStage(loadProfile(journal.profile));
  
  switch (cmd) {
    case '/exit':
    case '/quit':
    case '/q':
      console.log(chalk.yellow('\n📁 Saving conversation...'));
      await persistConversationState(projectId, stageNumber, messages);
      console.log(chalk.green('✓ Conversation saved. Goodbye!'));
      isShuttingDown = true;
      rl.close();
      return { type: 'exit' };

    case '/save':
      saveConversationHistory(projectId, stageNumber, messages);
      console.log(chalk.green('\n✓ Conversation saved to project.'));
      return { type: 'handled' };

    case '/clear':
      messages.length = 0;
      clearChatHistory();
      console.log(chalk.yellow('\n✓ Conversation history cleared.'));
      return { type: 'handled' };

    case '/stage':
      const newStage = parseInt(args[0]);
      if (isNaN(newStage) || newStage < 1 || newStage > maxStage) {
        console.log(chalk.red(`\nUsage: /stage <1-${maxStage}>`));
        return { type: 'handled' };
      }
      return { type: 'stage_changed', stageNumber: newStage };

    case '/generate':
      return await handleGenerate(projectId, stageNumber, journal);

    case '/help':
    case '/?':
      console.log(chalk.dim('\nAvailable commands:'));
      console.log(chalk.dim('  /exit, /quit, /q  - End chat session and save'));
      console.log(chalk.dim('  /save             - Save conversation to project'));
      console.log(chalk.dim('  /clear            - Clear conversation history'));
      console.log(chalk.dim('  /generate         - Generate the complete stage deliverable in one request, validate locally and save it'));
      console.log(chalk.dim(`  /stage N          - Switch to stage N (1-${maxStage})`));
      console.log(chalk.dim('  /status           - Show project status'));
      console.log(chalk.dim('  /provider         - Show current provider info'));
      console.log(chalk.dim('  /llm              - Change LLM model/provider in current session'));
      console.log(chalk.dim('  /key              - Change API key'));
      console.log(chalk.dim('  /key clear [name] - Remove stored API key(s)'));
      console.log(chalk.dim('  /help, /?         - Show this help'));
      return { type: 'handled' };

    case '/llm':
      console.log(chalk.yellow('\n  🔄 Zmiana modelu w trakcie sesji...'));
      
      const providers = Object.entries(PROVIDERS);
      console.log('\n  🔌 Wybierz dostawcę:');
      providers.forEach(([key, info], i) => {
        const hasKey = listStoredProviders().includes(key) ? chalk.green(' [key saved]') : '';
        console.log(`     ${i + 1}. ${info.name}${hasKey}`);
      });

      const num = await new Promise(resolve => rl.question('\n  Numer: ', resolve));
      const idx = parseInt(num) - 1;

      if (isNaN(idx) || idx < 0 || idx >= providers.length) {
        console.log(chalk.red('\n  Błąd: Nieprawidłowy wybór.'));
        return { type: 'handled' };
      }

      const [pKey, pInfo] = providers[idx];
      let key = getApiKey(pKey);
      if (!key) {
        console.log(chalk.yellow(`\n  Klucz API dla ${pInfo.name} nie został znaleziony.`));
        key = await new Promise(resolve => rl.question('  Podaj klucz API: ', resolve));
        if (!key.trim()) {
          console.log(chalk.red('  Błąd: Klucz jest wymagany.'));
          return { type: 'handled' };
        }
      }

      const discovery = await discoverProviderModels(pKey, key);
      const availableModels = discovery.models;
      console.log(`\n  📝 Wybierz model dla ${pInfo.name}:`);
      if (discovery.source === 'api') console.log(chalk.dim('     Modele dostępne dla podanego klucza API:'));
      if (discovery.error) console.log(chalk.yellow(`     Lista awaryjna: ${discovery.error.message}`));
      availableModels.forEach((m, ii) => console.log(`     ${ii + 1}. ${m}`));

      const mNum = await new Promise(resolve => rl.question('\n  Numer: ', resolve));
      const mIdx = parseInt(mNum) - 1;

      if (isNaN(mIdx) || mIdx < 0 || mIdx >= availableModels.length) {
        console.log(chalk.red('\n  Błąd: Nieprawidłowy wybór modelu.'));
        return { type: 'handled' };
      }

      const newModel = availableModels[mIdx];

      // Re-initialize
      try {
        await initializeProvider(pKey, key, newModel);
        console.log(chalk.green(`\n✓ Model zmieniony na: ${pInfo.name} - ${newModel}`));
      } catch (err) {
        console.error(chalk.red(`\nBłąd: ${err.message}`));
      }
      return { type: 'handled' };

    case '/key':
      if (args[0] === 'clear') {
        const target = args[1] || null;
        clearStoredKey(target);
        console.log(chalk.green(`\n✓ Stored API key${target ? ` for ${target}` : 's'} removed.`));
      } else {
        console.log(chalk.yellow('\n  To change your API key, restart chat:'));
        console.log(chalk.dim('    1. /key clear [provider]  — removes saved key'));
        console.log(chalk.dim('    2. /exit                  — exit chat'));
        console.log(chalk.dim('    3. babok chat …           — will prompt for new key'));
        const stored = listStoredProviders();
        if (stored.length > 0) {
          console.log(chalk.dim(`\n  Saved keys: ${stored.join(', ')}`));
        }
      }
      return { type: 'handled' };

    case '/provider':
      const info = getActiveProviderInfo();
      console.log(chalk.dim(`\n  Provider: ${info.name}`));
      console.log(chalk.dim(`  Model:    ${info.model}`));
      const savedProviders = listStoredProviders();
      if (savedProviders.length > 0) {
        console.log(chalk.dim(`  Saved keys: ${savedProviders.join(', ')}`));
      }
      return { type: 'handled' };

    case '/status':
      console.log(chalk.dim('\nProject Status:'));
      journal.stages.forEach(s => {
        const status = s.status === 'approved' ? chalk.green('✓') :
                       s.status === 'in_progress' ? chalk.yellow('●') :
                       chalk.dim('○');
        const current = s.stage === stageNumber ? chalk.cyan(' ← current') : '';
        console.log(`  ${status} Stage ${s.stage}: ${s.name}${current}`);
      });
      return { type: 'handled' };

    default:
      console.log(chalk.red(`\nUnknown command: ${cmd}. Type /help for available commands.`));
      return { type: 'handled' };
  }
}

/**
 * `/generate` — produce the stage deliverable in one LLM request and
 * persist it exactly like the MCP `babok_save_deliverable` +
 * `babok_submit_for_review` tools would: Two-Key-gated save, then an agent
 * submission so a human only needs to run `babok approve <id> <stage>` next.
 */
async function handleGenerate(projectId, stageNumber, journal) {
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) {
    console.log(chalk.red(`\n  Error: stage ${stageNumber} not found in journal.`));
    return { type: 'handled' };
  }

  try {
    guardSaveDeliverable(stage);
  } catch (err) {
    console.log(chalk.red(`\n  Error: ${err.message}`));
    return { type: 'handled' };
  }

  const profile = loadProfile(journal.profile);
  const rubric = loadRubric(profile);
  const stageRubric = rubric.stages[`stage${stageNumber}`];
  if (!stageRubric) {
    console.log(chalk.red(`\n  Error: no rubric entry for stage ${stageNumber} (profile ${profile.id}).`));
    return { type: 'handled' };
  }
  const isDeepStage = profile.orchestrator.deep_analysis_stages.includes(stageNumber);
  const stageMeta = profile.stages.find(s => s.stage === stageNumber);
  const language = journal.language === 'PL' ? 'PL' : 'EN';

  const conversationState = loadConversationState(projectId, stageNumber);
  const projectContext = {
    project_id: journal.project_id,
    project_name: journal.project_name,
    language: journal.language,
    decisions: journal.decisions,
    assumptions: journal.assumptions,
    open_questions: journal.open_questions,
    conversation_summary: conversationState.summary,
    conversation: conversationState.recentMessages,
  };

  const systemPromptBase = buildStageSystemPromptBase(profile, stageNumber, projectContext, language);
  const userMessageIntro = language === 'PL'
    ? `Wygeneruj kompletny dokument dostarczany dla Etapu ${stageNumber}: "${stageMeta?.name || ''}". Użyj kontekstu projektu i dotychczasowej rozmowy.`
    : `Generate the complete deliverable document for Stage ${stageNumber}: "${stageMeta?.name || ''}". Use the project context and the conversation so far.`;

  // Reuse the already-initialized provider session (set by `initializeProvider`
  // earlier in chatCommand) via the same {chat} adapter pattern already used
  // for the --debate flag above.
  const generationLlmClient = {
    chat: async (systemPrompt, userMessage, onChunk) => {
      startChatSession(systemPrompt, []);
      return sendMessageStream(userMessage, onChunk, { requestLabel: `Generate stage ${stageNumber}` });
    },
  };

  console.log(chalk.yellow('\n  Generating complete deliverable...'));

  try {
    const generation = await generateStagedDeliverable({
      stageNumber,
      profile,
      llmClient: generationLlmClient,
      systemPromptBase,
      userMessageIntro,
      context: projectContext,
      rubric,
      stageRubric,
      batchGroups: stageRubric.generation_batches,
      isDeepStage,
      projectDir: getProjectDir(projectId),
      options: {
        model: getActiveProviderInfo().model,
        onProgress: event => {
          if (event.type === 'draft_started') {
            process.stdout.write('\n  Drafting...');
          } else if (event.type === 'chunk') {
            process.stdout.write('.');
          } else if (event.type === 'local_scoring') {
            process.stdout.write(' -> local validation...');
          } else if (event.type === 'generation_complete') {
            process.stdout.write(` -> score ${event.score}${event.passed ? '' : ' (requires review)'}`);
          }
        },
      },
    });

    const fileName = getStageFileNames(profile)[stageNumber];
    const filePath = path.join(getProjectDir(projectId), fileName);
    await withStageLock(projectId, stageNumber, async () => {
      fs.writeFileSync(filePath, generation.finalDocument, 'utf-8');

      const sha = sha256Content(generation.finalDocument);
      stage.deliverable_file = fileName;
      if (stage.status === 'in_progress' || stage.revision_open) {
        stage.status = 'completed';
        stage.revision_open = false;
      }
      if (!stage.completed_at) stage.completed_at = new Date().toISOString();
      stage.generation_batches_used = generation.batches;
      stage.final_pass_mode = generation.finalPass.mode;
      writeJournal(projectId, journal);
      submitForReview(projectId, stageNumber, sha);
    });

    console.log(chalk.green(`\n  ✓ Deliverable generated and saved: ${fileName}`));
    console.log(chalk.dim(`    LLM requests: 1; local validation: ${generation.finalPass.finalScore}`));
    console.log(chalk.dim(`    Submitted for review. Next: babok approve ${projectId} ${stageNumber}`));
  } catch (err) {
    console.log(chalk.red(`\n  Error generating deliverable: ${err.message}`));
  }

  return { type: 'handled' };
}

/**
 * Load conversation history from project
 */
function loadConversationHistory(projectId, stageNumber) {
  const historyPath = path.join(getProjectDir(projectId), 'chat_history', `stage_${stageNumber}.json`);
  
  if (fs.existsSync(historyPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      return data.messages || [];
    } catch {
      return [];
    }
  }
  return [];
}

function loadConversationState(projectId, stageNumber) {
  const allMessages = loadConversationHistory(projectId, stageNumber);
  const { recentMessages, summary } = summarizeConversationHistory(allMessages);
  return { allMessages, recentMessages, summary };
}

/**
 * Save conversation history to project
 */
function saveConversationHistory(projectId, stageNumber, messages) {
  const chatDir = path.join(getProjectDir(projectId), 'chat_history');
  
  if (!fs.existsSync(chatDir)) {
    fs.mkdirSync(chatDir, { recursive: true });
  }
  
  const historyPath = path.join(chatDir, `stage_${stageNumber}.json`);
  const data = {
    project_id: projectId,
    stage: stageNumber,
    updated_at: new Date().toISOString(),
    message_count: messages.length,
    messages: messages,
  };
  
  fs.writeFileSync(historyPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function persistConversationState(projectId, stageNumber, messages) {
  return withStageLock(projectId, stageNumber, async () => {
    saveConversationHistory(projectId, stageNumber, messages);
    updateJournalWithChat(projectId, stageNumber, messages.length);
  });
}

export async function switchChatStage(projectId, journal, fromStage, toStage, messages) {
  await persistConversationState(projectId, fromStage, messages);
  const nextState = loadConversationState(projectId, toStage);
  return {
    stageNumber: toStage,
    messages: nextState.allMessages,
    recentMessages: nextState.recentMessages,
    systemPrompt: buildContextPrompt(journal, toStage, nextState.summary),
  };
}

/**
 * Update journal with chat activity
 */
function updateJournalWithChat(projectId, stageNumber, messageCount) {
  try {
    const journal = readJournal(projectId);
    const stage = journal.stages.find(s => s.stage === stageNumber);
    
    if (stage) {
      stage.last_chat_at = new Date().toISOString();
      stage.chat_message_count = messageCount;
    }
    
    writeJournal(projectId, journal);
  } catch (err) {
    console.error(chalk.dim(`Warning: Could not update journal: ${err.message}`));
  }
}
