import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { readJournal } from '../journal.js';
import { header, keyValue, printStageList, line } from '../display.js';

export async function loadProject(partialId) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok load <project_id>'
    );
    process.exit(1);
  }

  const journal = readJournal(projectId);

  console.log('');
  console.log(chalk.bold.blue('\uD83D\uDCC2 PROJECT LOADED'));
  console.log(chalk.dim(line()));
  keyValue('Project ID:', chalk.bold(journal.project_id));
  keyValue('Project Name:', journal.project_name);
  keyValue('Created:', journal.created_at.slice(0, 19).replace('T', ' '));
  keyValue('Last Updated:', journal.last_updated.slice(0, 19).replace('T', ' '));
  console.log(chalk.dim(line()));
  console.log('');
  console.log(chalk.bold('  Progress:'));
  printStageList(journal.stages);
  console.log('');

  // Print context block for AI chat
  console.log(chalk.dim(line('\u2500', 60)));
  console.log(chalk.bold.yellow('  Context block for AI chat (copy & paste):'));
  console.log(chalk.dim(line('\u2500', 60)));
  console.log('');

  const currentStage = journal.stages.find(s => s.status === 'in_progress');
  const approvedStages = journal.stages.filter(s => s.status === 'approved');

  let contextBlock = `LOAD PROJECT ${journal.project_id}\n`;
  contextBlock += `Project Name: ${journal.project_name}\n`;
  contextBlock += `Created: ${journal.created_at}\n`;
  if (approvedStages.length > 0) {
    contextBlock += `\nCompleted stages:\n`;
    for (const s of approvedStages) {
      contextBlock += `  - Stage ${s.stage}: ${s.name} (approved ${s.approved_at?.slice(0, 10)})\n`;
    }
  }
  if (currentStage) {
    contextBlock += `\nResume at: Stage ${currentStage.stage} - ${currentStage.name}\n`;
    if (currentStage.notes) {
      contextBlock += `Note: ${currentStage.notes}\n`;
    }
  }
  if (journal.decisions.length > 0) {
    contextBlock += `\nKey decisions made:\n`;
    for (const d of journal.decisions) {
      contextBlock += `  - ${d.description}\n`;
    }
  }

  console.log(contextBlock);
  console.log(chalk.dim(line('\u2500', 60)));
  console.log('');
  console.log(chalk.dim('Paste the above into your AI chat to resume this project.'));
  console.log('');
}
