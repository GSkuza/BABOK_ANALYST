#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { newProject } from '../src/commands/new.js';
import { listProjects } from '../src/commands/list.js';
import { showStatus } from '../src/commands/status.js';
import { loadProject } from '../src/commands/load.js';
import { saveProject } from '../src/commands/save.js';
import { approveCommand, rejectCommand, openRevisionCommand } from '../src/commands/approve.js';
import { exportProject } from '../src/commands/export.js';
import { chatCommand } from '../src/commands/chat.js';
import { setLanguageCommand, showLanguage } from '../src/commands/language.js';
import { listModels, changeModel } from '../src/commands/llm.js';
import {
  collectRepeatable,
  routingFailoverCommand,
  routingResetCommand,
  routingResolveCommand,
  routingSetCommand,
  routingShowCommand,
  routingUnsetCommand,
} from '../src/commands/routing.js';
import { getCurrentLanguage } from '../src/language.js';
import { makeCommand, makeDocx, makePdf } from '../src/commands/makedoc.js';
import { runAnalysis } from '../src/commands/run.js';
import { diffCommand } from '../src/commands/diff.js';
import { renameProject } from '../src/commands/rename.js';
import { deleteProject } from '../src/commands/delete.js';
import { setupWizard } from '../src/commands/setup.js';
import { scoreCommand } from '../src/commands/score.js';
import { validateCommand } from '../src/commands/validate.js';
import { ingestCommand } from '../src/commands/ingest.js';
import {
  createProductCommand,
  listProductsCommand,
  showProductCommand,
  addRepositoryCommand,
  buildBaselineCommand,
  listBaselinesCommand,
  showBaselineCommand,
  authorizeExecCommand,
  showExecAuthCommand,
  runExecCommand,
  parseRepoFlag,
} from '../src/commands/sd.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { version: cliVersion } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('babok')
  .description('BABOK Agent CLI - Project lifecycle management')
  .version(cliVersion);

program
  .command('new')
  .alias('NEW')
  .description('Create a new analysis project')
  .option('-n, --name <name>', 'Project name')
  .option('-l, --language <lang>', 'Project language (EN/PL)', getCurrentLanguage())
  .option('-p, --profile <id>', 'Pipeline profile (see profiles/)', 'babok')
  .option('--non-interactive', 'Fail instead of prompting when --name is missing')
  .action(newProject);

program
  .command('list')
  .alias('ls')
  .alias('LIST')
  .alias('LS')
  .description('List all projects')
  .action(listProjects);

program
  .command('status [id]')
  .alias('STATUS')
  .description('Show project status')
  .action(showStatus);

program
  .command('load <id>')
  .alias('LOAD')
  .description('Load project context for AI chat')
  .action(loadProject);

program
  .command('save <id>')
  .alias('SAVE')
  .description('Save project state snapshot')
  .action(saveProject);

program
  .command('approve <id> <stage>')
  .alias('APPROVE')
  .description('Human attestation + approve stage (Two-Key Journal key 2)')
  .option('-n, --notes <notes>', 'Approval notes')
  .option('--no-spot-check', 'Record attestation with spot_check_passed=false')
  .option('--attestor <name>', 'Attestor name (default: OS username)')
  .action(approveCommand);

program
  .command('open-revision <id> <stage>')
  .alias('OPEN-REVISION')
  .description('Re-open an approved stage for revision (clears attestation)')
  .action(openRevisionCommand);

program
  .command('reject <id> <stage>')
  .alias('REJECT')
  .description('Reject a stage with reason')
  .option('-r, --reason <reason>', 'Rejection reason')
  .action(rejectCommand);

program
  .command('export <id>')
  .alias('EXPORT')
  .description('Export project deliverables')
  .option('-o, --output <dir>', 'Output directory')
  .action(exportProject);

program
  .command('chat <id>')
  .alias('CHAT')
  .description('Interactive AI chat for current stage')
  .option('-s, --stage <number>', 'Stage number (1-8)')
  .option('-p, --provider <name>', 'AI provider: gemini, openai, anthropic, huggingface')
  .option('-m, --model <name>', 'Model name (provider-specific)')
  .option('--no-routing', 'Ignore advanced model routing (.babok_model_routing.json)')
  .option('--debate', 'Enable Analyst→Critic→Synthesiser debate for deep-analysis stages (3,4,6,8)')
  .action(chatCommand);

program
  .command('lang [language]')
  .alias('LANG')
  .alias('LANGUAGE')
  .description('Set or show language (EN/PL/ENG)')
  .action((language) => {
    if (!language) {
      showLanguage();
    } else {
      setLanguageCommand(language);
    }
  });

program
  .command('pl')
  .alias('PL')
  .description('Set language to Polish (shortcut for: babok lang PL)')
  .action(() => setLanguageCommand('PL'));

program
  .command('eng')
  .alias('ENG')
  .alias('EN')
  .description('Set language to English (shortcut for: babok lang EN)')
  .action(() => setLanguageCommand('EN'));

const llmCmd = program
  .command('llm')
  .alias('LLM')
  .description('Manage LLM providers and models');

llmCmd
  .command('list')
  .alias('ls')
  .alias('LIST')
  .description('List available models')
  .action(listModels);

llmCmd
  .command('change')
  .alias('ch')
  .alias('CHANGE')
  .description('Change active model')
  .action(changeModel);

llmCmd
  .command('key')
  .alias('KEY')
  .description('Shortcut to set API key')
  .action(changeModel); // changeModel also handles keys if missing

// Advanced model routing — shared with the Web UI (/settings/ai) and MCP server.
const routingCmd = program
  .command('routing')
  .alias('ROUTING')
  .description('Advanced model routing per profile and stage (provider, model, temperature, effort, failover)');

routingCmd
  .command('show')
  .description('Show the routing configuration and the providers with API keys')
  .option('--json', 'Print raw JSON')
  .action(routingShowCommand);

routingCmd
  .command('resolve')
  .description('Show the effective route (candidates, temperature, effort) for a profile/stage')
  .option('-p, --profile <id>', 'Pipeline profile (default: babok, or the project profile)')
  .option('-s, --stage <number>', 'Stage number')
  .option('--project <id>', 'Take the profile (and current stage) from a project')
  .option('--json', 'Print raw JSON')
  .action(routingResolveCommand);

routingCmd
  .command('set')
  .description('Set a routing rule (global default, profile default, or one stage)')
  .option('-p, --profile <id>', 'Profile to configure (omit for the global default)')
  .option('-s, --stage <number>', 'Stage to configure (requires --profile)')
  .option('--provider <name>', 'Provider: gemini, openai, anthropic, huggingface, vertex, local')
  .option('-m, --model <name>', 'Model id (requires --provider)')
  .option('-t, --temperature <value>', 'Temperature 0-2 ("none" to inherit)')
  .option('-e, --effort <level>', 'Reasoning effort: minimal, low, medium, high ("none" to inherit)')
  .option('-f, --fallback <provider[:model]>', 'Fallback candidate (repeatable, ordered; "none" clears inherited fallbacks)', collectRepeatable, [])
  .action(routingSetCommand);

routingCmd
  .command('unset')
  .description('Remove a routing rule (global default, profile, or one stage)')
  .option('-p, --profile <id>', 'Profile')
  .option('-s, --stage <number>', 'Stage (requires --profile)')
  .action(routingUnsetCommand);

routingCmd
  .command('failover <state>')
  .description('Fail over across every configured API key: on | off')
  .action(routingFailoverCommand);

routingCmd
  .command('reset')
  .description('Remove all routing rules')
  .action(routingResetCommand);

program
  .command('zacznij')
  .alias('ZACZNIJ')
  .description('Alias dla babok new (wymusza język polski)')
  .argument('[nowy]', 'opcjonalne słowo kluczowe "nowy"')
  .argument('[projekt]', 'opcjonalne słowo kluczowe "projekt"')
  .action(() => {
    newProject({ language: 'PL' });
  });

program
  .command('begin')
  .alias('BEGIN')
  .description('Alias for babok new (forces English language)')
  .argument('[new]', 'optional keyword "new"')
  .argument('[project]', 'optional keyword "project"')
  .action(() => {
    newProject({ language: 'EN' });
  });

program
  .command('run')
  .alias('RUN')
  .description('Run BABOK analysis pipeline — interactive by default (use --auto for fully automated)')
  .option('-c, --context <file>', 'Path to project_context.json (see templates/project_context.example.json)')
  .option('-n, --name <name>', 'Project name (overrides context file)')
  .option('-p, --prompt <text>', 'Short project description (alternative to --context)')
  .option('-o, --output <dir>', 'Output directory (default: BABOK_Analysis)')
  .option('--provider <name>', 'AI provider: gemini, openai, anthropic, huggingface, vertex')
  .option('-m, --model <name>', 'Model name (provider-specific)')
  .option('--deep-model <name>', 'Model for deep-analysis stages (per profile); defaults to --model')
  .option('--no-routing', 'Ignore advanced model routing (.babok_model_routing.json)')
  .option('-l, --lang <lang>', 'Language: EN or PL (overrides context file)')
  .option('-s, --stages <list>', 'Comma-separated stages to run, e.g. "1,2,3" (default: all)')
  .option('--profile <id>', 'Pipeline profile (see profiles/); prompts interactively if omitted')
  .option('--auto', 'Skip interactive review — run all stages fully automatically')
  .option('--debate', '(compatibility) Drafting uses one LLM request with local validation')
  .option('--verify', '(compatibility) Drafting uses one LLM request with local validation')
  .option('--diagram', 'Generate Mermaid process diagrams for Stage 2 (AS-IS) and Stage 5 (TO-BE)')
  .option('--orchestrate', 'Use orchestrator engine for automated multi-stage pipeline')
  .action(runAnalysis);

program
  .command('rename <id> [new-name]')
  .alias('RENAME')
  .description('Rename a project')
  .action(renameProject);

program
  .command('delete <id>')
  .alias('DELETE')
  .alias('rm')
  .alias('RM')
  .description('Permanently delete a project (with confirmation)')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(deleteProject);

program
  .command('setup')
  .alias('SETUP')
  .alias('init')
  .alias('INIT')
  .description('Interactive first-time setup wizard (API keys, language)')
  .action(setupWizard);

program
  .command('diff <id> [id2]')
  .alias('DIFF')
  .description('Show stage history (single ID) or diff deliverables line-by-line (two IDs)')
  .option('-s, --stage <number>', 'Stage number to inspect/diff (0-8)')
  .option('-c, --context <lines>', 'Lines of context around changes (two-ID mode)', '3')
  .action(diffCommand);

// MAKE command with subcommands for DOCX and PDF generation
const makeCmd = program
  .command('make')
  .alias('MAKE')
  .description('Generate professional DOCX/PDF documents from stage files');

makeCmd
  .command('docx <id>')
  .alias('DOCX')
  .description('Generate DOCX document(s) from stage files')
  .option('-s, --stage <number>', 'Stage number (1-8) - generates only that stage')
  .option('-o, --output <dir>', 'Output directory')
  .action(makeDocx);

makeCmd
  .command('pdf <id>')
  .alias('PDF')
  .description('Generate PDF document(s) from stage files')
  .option('-s, --stage <number>', 'Stage number (1-8) - generates only that stage')
  .option('-o, --output <dir>', 'Output directory')
  .action(makePdf);

makeCmd
  .command('all <id>')
  .alias('ALL')
  .description('Generate both DOCX and PDF documents')
  .option('-s, --stage <number>', 'Stage number (1-8)')
  .option('-o, --output <dir>', 'Output directory')
  .action((id, options) => makeCommand('all', id, options));

program
  .command('score <id> <stage>')
  .alias('SCORE')
  .description('Score stage quality against the rubric (stage: 1-8 or "all")')
  .action(scoreCommand);

program
  .command('ingest <file>')
  .alias('INGEST')
  .description('Ingest a document (PDF/DOCX/XLSX/CSV/TXT/MD) into project context')
  .option('-p, --project <id>', 'Project ID (partial match supported)')
  .option('--provider <name>', 'AI provider: gemini, openai, anthropic, huggingface, vertex')
  .option('-m, --model <name>', 'Model name (provider-specific)')
  .action(ingestCommand);

program
  .command('validate <id>')
  .alias('VALIDATE')
  .description('Run cross-stage consistency validation')
  .action(validateCommand);

// SD command group — software-development profile: durable products/baselines,
// evidence-backed repository analysis, and authorisation-gated command execution.
// Approving a stage never implies any of these run automatically — every write
// here (product/baseline creation, execution authorisation) is an explicit,
// separate human action.
const sdCmd = program
  .command('sd')
  .description('Software-development profile: products, repository baselines, execution authorisation');

const sdProductCmd = sdCmd.command('product').description('Durable products and their repositories');
sdProductCmd
  .command('create')
  .description('Create a new product')
  .requiredOption('--name <name>', 'Product name')
  .option('--repo <host:owner:name[:role]>', 'Repository to attach (repeatable)', parseRepoFlag, [])
  .action(createProductCommand);
sdProductCmd
  .command('list')
  .description('List all products')
  .action(listProductsCommand);
sdProductCmd
  .command('show <productId>')
  .description('Show a product and its baseline ids')
  .action(showProductCommand);
sdProductCmd
  .command('add-repo <productId>')
  .description('Attach or update a repository on a product')
  .requiredOption('--repo <host:owner:name[:role]>', 'Repository to add')
  .action((productId, options) => addRepositoryCommand(productId, options.repo));

const sdBaselineCmd = sdCmd.command('baseline').description('Immutable, evidence-backed product baselines');
sdBaselineCmd
  .command('build <productId>')
  .description('Autonomously build a new baseline from the product\'s repositories (mechanical evidence; adds LLM narrative only if a provider is configured)')
  .action(buildBaselineCommand);
sdBaselineCmd
  .command('list <productId>')
  .description('List baselines for a product')
  .action(listBaselinesCommand);
sdBaselineCmd
  .command('show <productId> <baselineId>')
  .description('Show one baseline manifest')
  .action(showBaselineCommand);

const sdExecCmd = sdCmd.command('exec').description('Authorisation-gated execution of the analysed repository\'s own commands');
sdExecCmd
  .command('authorize <initiativeId>')
  .description('Record (or revoke) an explicit human execution authorisation for one initiative')
  .requiredOption('--scope <scope>', 'run_tests | publish_branch')
  .option('--commands <list>', 'Comma-separated allowed commands, e.g. "node,npm"')
  .option('--dirs <list>', 'Comma-separated allowed working directories')
  .option('--by <name>', 'Who is authorising this')
  .option('--revoke', 'Revoke instead of grant')
  .action(authorizeExecCommand);
sdExecCmd
  .command('show <initiativeId> <scope>')
  .description('Show the current authorisation record for one scope')
  .action(showExecAuthCommand);
sdExecCmd
  .command('run <initiativeId> <command> [args...]')
  .description('Run one authorised, whitelisted command, e.g. babok sd exec run SD-2026... node script.js')
  .requiredOption('--cwd <dir>', 'Working directory (must be within the authorisation\'s allowedDirectories)')
  .action((initiativeId, command, args, options) => runExecCommand(initiativeId, options, command, args));

program.parse();
