import { createInterface } from 'readline';
import { generateProjectId, getProjectDir } from '../project.js';
import { createJournal } from '../journal.js';
import { printProjectCreated } from '../display.js';
import { getCurrentLanguage, getText } from '../language.js';

export async function newProject(options) {
  let projectName = options.name;
  const language = options.language || getCurrentLanguage();

  if (!projectName) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const prompt = language === 'PL' ? 'Nazwa projektu: ' : 'Project name: ';
    projectName = await new Promise(resolve => {
      rl.question(prompt, answer => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  if (!projectName) {
    const errorMsg = language === 'PL' 
      ? 'Błąd: Nazwa projektu jest wymagana.'
      : 'Error: Project name is required.';
    console.error(errorMsg);
    process.exit(1);
  }

  const projectId = generateProjectId();
  const projectDir = getProjectDir(projectId);
  createJournal(projectId, projectName, language);
  printProjectCreated(projectId, projectName, projectDir, language);
}
