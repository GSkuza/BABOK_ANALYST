#!/usr/bin/env node

import { Command } from 'commander';
import { newProject } from '../src/commands/new.js';
import { listProjects } from '../src/commands/list.js';
import { showStatus } from '../src/commands/status.js';
import { loadProject } from '../src/commands/load.js';
import { saveProject } from '../src/commands/save.js';
import { approveCommand, rejectCommand } from '../src/commands/approve.js';
import { exportProject } from '../src/commands/export.js';

const program = new Command();

program
  .name('babok')
  .description('BABOK Agent CLI - Project lifecycle management')
  .version('1.3.0');

program
  .command('new')
  .description('Create a new BABOK analysis project')
  .option('-n, --name <name>', 'Project name')
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

program.parse();
