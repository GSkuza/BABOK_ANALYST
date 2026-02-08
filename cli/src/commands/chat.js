import chalk from 'chalk';
import readline from 'readline';
import { resolveProjectId, getProjectDir, STAGES } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';
import { header, keyValue, line } from '../display.js';
import { 
  PROVIDERS,
  initializeProvider, 
  startChatSession, 
  sendMessageStream, 
  getActiveProviderInfo,
  loadStagePrompt,
  loadMainSystemPrompt,
  getApiKey,
  promptForProvider,
  clearStoredKey,
  listStoredProviders,
} from '../llm.js';
import fs from 'fs';
import path from 'path';

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
  let stageNumber = options.stage ? parseInt(options.stage) : journal.current_stage;
  if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > 8) {
    console.error(chalk.red('Error: Stage must be a number between 1 and 8'));
    process.exit(1);
  }

  const stageName = STAGES.find(s => s.stage === stageNumber)?.name || `Stage ${stageNumber}`;

  // ── Provider & API Key selection ──
  let provider = options.provider || null;
  let apiKey = null;
  let modelName = options.model || null;

  if (provider && PROVIDERS[provider]) {
    // Provider specified via --provider flag
    apiKey = getApiKey(provider);
    if (!apiKey) {
      try {
        const result = await promptForProvider();
        provider = result.provider;
        apiKey = result.apiKey;
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
  keyValue('Stage:', chalk.cyan(`${stageNumber} - ${stageName}`));
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
    initializeProvider(provider, apiKey, modelName);
  } catch (err) {
    console.error(chalk.red(`Error initializing ${PROVIDERS[provider]?.name}: ${err.message}`));
    process.exit(1);
  }

  // Build context prompt
  const systemPrompt = buildContextPrompt(journal, stageNumber);
  
  // Load previous conversation history if exists
  const conversationHistory = loadConversationHistory(projectId, stageNumber);
  
  // Start chat session
  startChatSession(systemPrompt, conversationHistory);

  // Track messages for saving
  const messages = [...conversationHistory];
  let messageCount = 0;

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

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
        const handled = await handleCommand(trimmed, rl, projectId, stageNumber, messages, journal);
        if (handled === 'exit') {
          return;
        }
        if (handled === 'stage_changed') {
          // Reinitialize with new stage
          const newStage = parseInt(trimmed.split(' ')[1]);
          if (!isNaN(newStage) && newStage >= 1 && newStage <= 8) {
            stageNumber = newStage;
            const newPrompt = buildContextPrompt(journal, stageNumber);
            startChatSession(newPrompt, []);
            messages.length = 0;
            console.log(chalk.green(`\n✓ Switched to Stage ${stageNumber}`));
          }
        }
        prompt();
        return;
      }

      // Send message to AI
      const { name: providerName } = getActiveProviderInfo();
      console.log(chalk.blue(`\n🤖 BABOK Agent (${providerName}): `));
      
      try {
        const response = await sendMessageStream(trimmed, (chunk) => {
          process.stdout.write(chunk);
        });
        console.log(''); // New line after response

        // Track messages
        messages.push({ role: 'user', parts: [{ text: trimmed }] });
        messages.push({ role: 'model', parts: [{ text: response }] });
        messageCount++;

        // Auto-save every 5 messages
        if (messageCount % 5 === 0) {
          saveConversationHistory(projectId, stageNumber, messages);
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
    console.log(chalk.yellow('\n\n📁 Saving conversation...'));
    saveConversationHistory(projectId, stageNumber, messages);
    updateJournalWithChat(projectId, stageNumber, messages.length);
    console.log(chalk.green('✓ Conversation saved. Goodbye!'));
    process.exit(0);
  });

  // Start prompting
  console.log(chalk.cyan('💬 Start chatting with BABOK Agent...'));
  prompt();
}

/**
 * Build context prompt with project info
 */
function buildContextPrompt(journal, stageNumber) {
  const mainPrompt = loadMainSystemPrompt();
  const stagePrompt = loadStagePrompt(stageNumber);
  
  const stageName = STAGES.find(s => s.stage === stageNumber)?.name || `Stage ${stageNumber}`;
  const stageInfo = journal.stages.find(s => s.stage === stageNumber);
  
  let contextBlock = `
=== PROJECT CONTEXT ===
Project ID: ${journal.project_id}
Project Name: ${journal.project_name}
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
======================

`;

  return mainPrompt + '\n\n' + stagePrompt + '\n\n' + contextBlock;
}

/**
 * Handle slash commands
 */
async function handleCommand(command, rl, projectId, stageNumber, messages, journal) {
  const [cmd, ...args] = command.toLowerCase().split(' ');
  
  switch (cmd) {
    case '/exit':
    case '/quit':
    case '/q':
      console.log(chalk.yellow('\n📁 Saving conversation...'));
      saveConversationHistory(projectId, stageNumber, messages);
      updateJournalWithChat(projectId, stageNumber, messages.length);
      console.log(chalk.green('✓ Conversation saved. Goodbye!'));
      rl.close();
      return 'exit';

    case '/save':
      saveConversationHistory(projectId, stageNumber, messages);
      console.log(chalk.green('\n✓ Conversation saved to project.'));
      return 'handled';

    case '/clear':
      messages.length = 0;
      console.log(chalk.yellow('\n✓ Conversation history cleared.'));
      return 'handled';

    case '/stage':
      const newStage = parseInt(args[0]);
      if (isNaN(newStage) || newStage < 1 || newStage > 8) {
        console.log(chalk.red('\nUsage: /stage <1-8>'));
        return 'handled';
      }
      return 'stage_changed';

    case '/help':
    case '/?':
      console.log(chalk.dim('\nAvailable commands:'));
      console.log(chalk.dim('  /exit, /quit, /q  - End chat session and save'));
      console.log(chalk.dim('  /save             - Save conversation to project'));
      console.log(chalk.dim('  /clear            - Clear conversation history'));
      console.log(chalk.dim('  /stage N          - Switch to stage N (1-8)'));
      console.log(chalk.dim('  /status           - Show project status'));
      console.log(chalk.dim('  /provider         - Show current provider info'));
      console.log(chalk.dim('  /key              - Change API key'));
      console.log(chalk.dim('  /key clear [name] - Remove stored API key(s)'));
      console.log(chalk.dim('  /help, /?         - Show this help'));
      return 'handled';

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
      return 'handled';

    case '/provider':
      const info = getActiveProviderInfo();
      console.log(chalk.dim(`\n  Provider: ${info.name}`));
      console.log(chalk.dim(`  Model:    ${info.model}`));
      const savedProviders = listStoredProviders();
      if (savedProviders.length > 0) {
        console.log(chalk.dim(`  Saved keys: ${savedProviders.join(', ')}`));
      }
      return 'handled';

    case '/status':
      console.log(chalk.dim('\nProject Status:'));
      journal.stages.forEach(s => {
        const status = s.status === 'approved' ? chalk.green('✓') :
                       s.status === 'in_progress' ? chalk.yellow('●') :
                       chalk.dim('○');
        const current = s.stage === stageNumber ? chalk.cyan(' ← current') : '';
        console.log(`  ${status} Stage ${s.stage}: ${s.name}${current}`);
      });
      return 'handled';

    default:
      console.log(chalk.red(`\nUnknown command: ${cmd}. Type /help for available commands.`));
      return 'handled';
  }
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

/**
 * Update journal with chat activity
 */
function updateJournalWithChat(projectId, stageNumber, messageCount) {
  try {
    const journal = readJournal(projectId);
    const stage = journal.stages.find(s => s.stage === stageNumber);
    
    if (stage) {
      stage.last_chat_at = new Date().toISOString();
      stage.chat_message_count = (stage.chat_message_count || 0) + messageCount;
    }
    
    writeJournal(projectId, journal);
  } catch (err) {
    console.error(chalk.dim(`Warning: Could not update journal: ${err.message}`));
  }
}
