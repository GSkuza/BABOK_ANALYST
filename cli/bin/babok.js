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
import { getCurrentLanguage } from '../src/language.js';

const program = new Command();

program
  .name('babok')
  .description('BABOK Agent CLI - Project lifecycle management')
  .version('1.6.0');

program
  .command('new')
  .description('Create a new BABOK analysis project')
  .option('-n, --name <name>', 'Project name')
  .option('-l, --language <lang>', 'Project language (EN/PL)', getCurrentLanguage())
  .action(newProject);

program
  .command('list')
  .alias('ls')
  .description('List all projects')
  .action(listProjects);

program
  .command('status [id]')
  .description('Show project status')
  .action(showStatus);

program
  .command('load <id>')
  .description('Load project context for AI chat')
  .action(loadProject);

program
  .command('save <id>')
  .description('Save project state snapshot')
  .action(saveProject);

program
  .command('approve <id> <stage>')
  .description('Approve a stage (marks as approved, advances to next)')
  .action(approveCommand);

program
  .command('reject <id> <stage>')
  .description('Reject a stage with reason')
  .option('-r, --reason <reason>', 'Rejection reason')
  .action(rejectCommand);

program
  .command('export <id>')
  .description('Export project deliverables')
  .option('-o, --output <dir>', 'Output directory')
  .action(exportProject);

program
  .command('chat <id>')
  .description('Interactive AI chat for current stage')
  .option('-s, --stage <number>', 'Stage number (1-8)')
  .option('-p, --provider <name>', 'AI provider: gemini, openai, anthropic, huggingface')
  .option('-m, --model <name>', 'Model name (provider-specific)')
  .action(chatCommand);

program
  .command('lang [language]')
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
  .description('Set language to Polish (shortcut for: babok lang PL)')
  .action(() => setLanguageCommand('PL'));

program
  .command('eng')
  .description('Set language to English (shortcut for: babok lang EN)')
  .action(() => setLanguageCommand('EN'));

program.parse();
