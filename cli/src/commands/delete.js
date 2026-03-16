import chalk from 'chalk';
import fs from 'fs';
import { createInterface } from 'readline';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal } from '../journal.js';

/**
 * babok delete <id> [--force]
 * Permanently removes a project directory after confirmation.
 */
export async function deleteProject(partialId, options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok delete <id>'
    ));
    process.exit(1);
  }

  let journal;
  try {
    journal = readJournal(projectId);
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }

  const projectDir = getProjectDir(projectId);
  const approvedStages = journal.stages.filter(s => s.status === 'approved').length;

  console.log('');
  console.log(chalk.yellow('⚠  You are about to permanently delete a project:'));
  console.log(chalk.dim(`  ID:      ${projectId}`));
  console.log(chalk.dim(`  Name:    ${journal.project_name}`));
  console.log(chalk.dim(`  Stages approved: ${approvedStages} / ${journal.stages.length}`));
  console.log(chalk.dim(`  Directory: ${projectDir}`));
  console.log('');

  if (!options.force) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question(chalk.red(`  Type the project ID to confirm deletion: `), answer => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (answer !== projectId) {
      console.log(chalk.dim('\n  Deletion cancelled.'));
      return;
    }
  }

  try {
    fs.rmSync(projectDir, { recursive: true, force: true });
    console.log('');
    console.log(chalk.green(`✓ Project ${projectId} deleted.`));
    console.log('');
  } catch (err) {
    console.error(chalk.red(`Error deleting project: ${err.message}`));
    process.exit(1);
  }
}
