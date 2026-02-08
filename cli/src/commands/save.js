import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { readJournal, writeJournal } from '../journal.js';
import { header, keyValue, printStageList, line } from '../display.js';

export async function saveProject(partialId) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok save <project_id>'
    );
    process.exit(1);
  }

  const journal = readJournal(projectId);

  // Trigger a save (updates last_updated timestamp)
  writeJournal(projectId, journal);

  const approved = journal.stages.filter(s => s.status === 'approved').length;
  const inProgress = journal.stages.find(s => s.status === 'in_progress');

  console.log('');
  console.log(chalk.bold.green('\uD83D\uDCBE PROJECT SAVED'));
  console.log(chalk.dim(line()));
  keyValue('Project ID:', chalk.bold(journal.project_id));
  keyValue('Saved at:', new Date().toISOString().slice(0, 19).replace('T', ' '));
  keyValue('Progress:', `Stage ${journal.current_stage} of 8 (${approved} approved)`);
  console.log(chalk.dim(line()));
  console.log('');
  console.log(chalk.yellow(`To resume later: ${chalk.bold(`babok load ${projectId}`)}`));
  console.log('');
}
