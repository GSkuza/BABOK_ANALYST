import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { approveStage, rejectStage, readJournal } from '../journal.js';
import { header, keyValue, printStageList, line } from '../display.js';

export async function approveCommand(partialId, stageStr) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(`Error: Project not found: ${partialId}`);
    process.exit(1);
  }

  const stageNumber = parseInt(stageStr, 10);
  if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > 8) {
    console.error('Error: Stage must be a number between 1 and 8.');
    process.exit(1);
  }

  try {
    const journal = approveStage(projectId, stageNumber);
    const stage = journal.stages.find(s => s.stage === stageNumber);

    console.log('');
    console.log(chalk.bold.green(`\u2705 Stage ${stageNumber} APPROVED`));
    console.log(chalk.dim(line()));
    keyValue('Project:', journal.project_id);
    keyValue('Stage:', `${stageNumber} - ${stage.name}`);
    keyValue('Approved at:', stage.approved_at.slice(0, 19).replace('T', ' '));
    console.log(chalk.dim(line()));

    const next = journal.stages.find(s => s.stage === stageNumber + 1);
    if (next) {
      console.log('');
      console.log(chalk.yellow(`Next: Stage ${next.stage} - ${next.name}`));
    } else {
      console.log('');
      console.log(chalk.bold.green('All 8 stages complete! Use: babok export ' + projectId));
    }
    console.log('');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

export async function rejectCommand(partialId, stageStr, options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(`Error: Project not found: ${partialId}`);
    process.exit(1);
  }

  const stageNumber = parseInt(stageStr, 10);
  if (isNaN(stageNumber) || stageNumber < 1 || stageNumber > 8) {
    console.error('Error: Stage must be a number between 1 and 8.');
    process.exit(1);
  }

  const reason = options.reason || 'No reason provided';

  try {
    const journal = rejectStage(projectId, stageNumber, reason);
    const stage = journal.stages.find(s => s.stage === stageNumber);

    console.log('');
    console.log(chalk.bold.red(`\u274C Stage ${stageNumber} REJECTED`));
    console.log(chalk.dim(line()));
    keyValue('Project:', journal.project_id);
    keyValue('Stage:', `${stageNumber} - ${stage.name}`);
    keyValue('Reason:', reason);
    console.log(chalk.dim(line()));
    console.log('');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}
