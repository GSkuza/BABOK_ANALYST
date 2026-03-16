import chalk from 'chalk';
import { createInterface } from 'readline';
import { resolveProjectId } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';

/**
 * babok rename <id> [new-name]
 * Renames a project (updates project_name in journal; directory ID does NOT change).
 */
export async function renameProject(partialId, newName, options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(chalk.red(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok rename <id> <new-name>'
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

  const oldName = journal.project_name;

  // If new name was not provided as CLI argument, prompt interactively
  if (!newName) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    newName = await new Promise(resolve => {
      rl.question(chalk.cyan(`  New project name [${oldName}]: `), answer => {
        rl.close();
        resolve(answer.trim() || oldName);
      });
    });
  }

  if (!newName || newName === oldName) {
    console.log(chalk.dim('No change.'));
    return;
  }

  journal.project_name = newName;
  writeJournal(projectId, journal);

  console.log('');
  console.log(chalk.green(`✓ Project renamed`));
  console.log(chalk.dim(`  ID:       ${projectId}`));
  console.log(chalk.dim(`  Old name: ${oldName}`));
  console.log(chalk.dim(`  New name: ${chalk.bold(newName)}`));
  console.log('');
}
