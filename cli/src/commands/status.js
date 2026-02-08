import chalk from 'chalk';
import { resolveProjectId } from '../project.js';
import { readJournal } from '../journal.js';
import { header, keyValue, printStageList, line } from '../display.js';

export async function showStatus(partialId) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided and multiple projects exist. Specify an ID.'
    );
    process.exit(1);
  }

  const journal = readJournal(projectId);

  header(`Project Status: ${projectId}`);
  keyValue('Project ID:', chalk.bold(journal.project_id));
  keyValue('Project Name:', journal.project_name);
  keyValue('Created:', journal.created_at.slice(0, 19).replace('T', ' '));
  keyValue('Last Updated:', journal.last_updated.slice(0, 19).replace('T', ' '));
  console.log('');

  console.log(chalk.bold('  Stages:'));
  printStageList(journal.stages);

  if (journal.decisions.length > 0) {
    console.log('');
    console.log(chalk.bold('  Decisions:'));
    for (const d of journal.decisions) {
      console.log(`    - ${d.description || d.id}`);
    }
  }

  if (journal.assumptions.length > 0) {
    console.log('');
    console.log(chalk.bold('  Assumptions:'));
    for (const a of journal.assumptions) {
      console.log(`    - ${a.description || a.id}`);
    }
  }

  if (journal.open_questions.length > 0) {
    console.log('');
    console.log(chalk.bold('  Open Questions:'));
    for (const q of journal.open_questions) {
      console.log(`    - ${q.question || q.id}`);
    }
  }

  console.log('');
}
