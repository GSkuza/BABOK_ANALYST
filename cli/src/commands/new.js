import { createInterface } from 'readline';
import { generateProjectId, getProjectDir } from '../project.js';
import { createJournal } from '../journal.js';
import { printProjectCreated } from '../display.js';

export async function newProject(options) {
  let projectName = options.name;

  if (!projectName) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    projectName = await new Promise(resolve => {
      rl.question('Project name: ', answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!projectName) {
    console.error('Error: Project name is required.');
    process.exit(1);
  }

  const projectId = generateProjectId();
  const projectDir = getProjectDir(projectId);
  createJournal(projectId, projectName);
  printProjectCreated(projectId, projectName, projectDir);
}
