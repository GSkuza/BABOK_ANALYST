import chalk from 'chalk';
import os from 'os';
import { resolveProjectId } from '../project.js';
import {
  approveStage,
  rejectStage,
  attestStage,
  submitForReview,
  openRevision,
  getStageDeliverableHash,
  getProjectProfile,
} from '../journal.js';
import { getMaxStage } from '../profiles.js';
import { header, keyValue, printStageList, line } from '../display.js';

/** Parse and range-check a stage argument against the project's profile; exits on error. */
function parseStageArg(projectId, stageStr) {
  const maxStage = getMaxStage(getProjectProfile(projectId));
  const stageNumber = parseInt(stageStr, 10);
  if (isNaN(stageNumber) || stageNumber < 0 || stageNumber > maxStage) {
    console.error(`Error: Stage must be a number between 0 and ${maxStage}.`);
    process.exit(1);
  }
  return stageNumber;
}

/**
 * Human approval: attest on-disk deliverable (key 2) then approve if SHA matches agent submission.
 */
export async function approveCommand(partialId, stageStr, options = {}) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(`Error: Project not found: ${partialId}`);
    process.exit(1);
  }

  const stageNumber = parseStageArg(projectId, stageStr);

  const attestor = options.attestor || process.env.USER || process.env.USERNAME || os.userInfo().username || 'Human';
  const spotCheckPassed = options.spotCheck !== false;

  try {
    const { filePath, sha256 } = getStageDeliverableHash(projectId, stageNumber);
    if (!sha256) {
      console.error(`Error: No deliverable file for stage ${stageNumber}.`);
      console.error(`Expected: ${filePath}`);
      process.exit(1);
    }

    attestStage(projectId, stageNumber, attestor, spotCheckPassed, sha256);
    const journal = approveStage(projectId, stageNumber, options.notes, sha256);
    const stage = journal.stages.find(s => s.stage === stageNumber);

    console.log('');
    console.log(chalk.bold.green(`\u2705 Stage ${stageNumber} APPROVED (Two-Key)`));
    console.log(chalk.dim(line()));
    keyValue('Project:', journal.project_id);
    keyValue('Stage:', `${stageNumber} - ${stage.name}`);
    keyValue('Attestor:', stage.human_attestation?.attestor || attestor);
    keyValue('SHA-256:', sha256.slice(0, 16) + '…');
    keyValue('Approved at:', stage.approved_at.slice(0, 19).replace('T', ' '));
    console.log(chalk.dim(line()));

    const next = journal.stages.find(s => s.stage === stageNumber + 1);
    if (next) {
      console.log('');
      console.log(chalk.yellow(`Next: Stage ${next.stage} - ${next.name}`));
    } else {
      console.log('');
      console.log(chalk.bold.green('All stages complete! Use: babok export ' + projectId));
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

  const stageNumber = parseStageArg(projectId, stageStr);

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

export async function openRevisionCommand(partialId, stageStr) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(`Error: Project not found: ${partialId}`);
    process.exit(1);
  }

  const stageNumber = parseStageArg(projectId, stageStr);

  try {
    const journal = openRevision(projectId, stageNumber);
    const stage = journal.stages.find(s => s.stage === stageNumber);

    console.log('');
    console.log(chalk.bold.yellow(`\uD83D\uDD13 Revision opened for stage ${stageNumber}`));
    console.log(chalk.dim(line()));
    keyValue('Project:', journal.project_id);
    keyValue('Stage:', `${stageNumber} - ${stage.name}`);
    keyValue('Status:', stage.status);
    keyValue('revision_open:', String(stage.revision_open));
    console.log(chalk.dim(line()));
    console.log(chalk.dim('Agent may save deliverable and submit for review again.'));
    console.log('');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

export { submitForReview };
