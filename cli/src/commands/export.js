import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { resolveProjectId, getProjectDir } from '../project.js';
import { readJournal } from '../journal.js';
import { header, keyValue, line } from '../display.js';

export async function exportProject(partialId, options) {
  const projectId = resolveProjectId(partialId);
  if (!projectId) {
    console.error(partialId
      ? `Error: Project not found: ${partialId}`
      : 'Error: No project ID provided. Usage: babok export <project_id>'
    );
    process.exit(1);
  }

  const journal = readJournal(projectId);
  const projectDir = getProjectDir(projectId);
  const outputDir = options.output || path.join(process.cwd(), 'export', projectId);

  fs.mkdirSync(outputDir, { recursive: true });

  // Copy journal
  const journalSrc = path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`);
  const journalDst = path.join(outputDir, `PROJECT_JOURNAL_${projectId}.json`);
  fs.copyFileSync(journalSrc, journalDst);

  // Copy all .md files from project dir
  let fileCount = 1; // journal already copied
  const files = fs.readdirSync(projectDir);
  for (const file of files) {
    if (file.endsWith('.md')) {
      fs.copyFileSync(
        path.join(projectDir, file),
        path.join(outputDir, file)
      );
      fileCount++;
    }
  }

  console.log('');
  console.log(chalk.bold.green('\uD83D\uDCE6 PROJECT EXPORTED'));
  console.log(chalk.dim(line()));
  keyValue('Project:', journal.project_id);
  keyValue('Name:', journal.project_name);
  keyValue('Files:', `${fileCount} file(s)`);
  keyValue('Output:', outputDir);
  console.log(chalk.dim(line()));
  console.log('');
}
