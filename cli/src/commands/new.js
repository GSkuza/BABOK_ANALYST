import { createInterface } from 'readline';
import { generateProjectId, getProjectDir } from '../project.js';
import { createJournal } from '../journal.js';
import { DEFAULT_PROFILE_ID, listProfileIds, loadProfile } from '../profiles.js';
import { printProjectCreated } from '../display.js';
import { getCurrentLanguage, getText } from '../language.js';

export async function newProject(options) {
  let projectName = options.name;
  const language = options.language || getCurrentLanguage();

  let profile;
  try {
    profile = loadProfile(options.profile || DEFAULT_PROFILE_ID);
  } catch {
    const available = listProfileIds().join(', ');
    console.error(language === 'PL'
      ? `Błąd: Nieznany profil "${options.profile}". Dostępne: ${available}`
      : `Error: Unknown profile "${options.profile}". Available: ${available}`);
    process.exit(1);
  }

  if (!projectName && !options.nonInteractive) {
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

  const projectId = generateProjectId(profile);
  const projectDir = getProjectDir(projectId);
  createJournal(projectId, projectName, language, profile.id);
  printProjectCreated(projectId, projectName, projectDir, language, profile);
}
