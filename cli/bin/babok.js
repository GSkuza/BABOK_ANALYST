#!/usr/bin/env node

import { Command } from 'commander';
import { newProject } from '../src/commands/new.js';
import { listProjects } from '../src/commands/list.js';
import { showStatus } from '../src/commands/status.js';
import { loadProject } from '../src/commands/load.js';
import { saveProject } from '../src/commands/save.js';
import { approveCommand, rejectCommand } from '../src/commands/approve.js';
import { exportProject } from '../src/commands/export.js';
import { chatCommand } from '../src/commands/chat.js';
import { setLanguageCommand, showLanguage } from '../src/commands/language.js';
import { listModels, changeModel } from '../src/commands/llm.js';
import { getCurrentLanguage } from '../src/language.js';
import { makeCommand, makeDocx, makePdf } from '../src/commands/makedoc.js';
import { runAnalysis } from '../src/commands/run.js';
import { diffCommand } from '../src/commands/diff.js';

const program = new Command();

program
  .name('babok')
  .description('BABOK Agent CLI - Project lifecycle management')
  .version('1.9.0');

program
  .command('new')
  .alias('NEW')
  .description('Create a new BABOK analysis project')
  .option('-n, --name <name>', 'Project name')
  .option('-l, --language <lang>', 'Project language (EN/PL)', getCurrentLanguage())
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
  .description('Approve a stage (marks as approved, advances to next)')
  .action(approveCommand);

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
  .option('-l, --lang <lang>', 'Language: EN or PL (overrides context file)')
  .option('-s, --stages <list>', 'Comma-separated stages to run, e.g. "1,2,3" (default: all)')
  .option('--auto', 'Skip interactive review — run all stages fully automatically')
  .action(runAnalysis);

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

program.parse();
