import { listProjectIds } from '../project.js';
import { readJournal } from '../journal.js';
import { header, printProjectTable } from '../display.js';

export async function listProjects() {
  header('BABOK Projects');

  const ids = listProjectIds();
  const projects = [];

  for (const id of ids) {
    try {
      const journal = readJournal(id);
      projects.push(journal);
    } catch {
      // skip corrupted journals
    }
  }

  projects.sort((a, b) => b.last_updated.localeCompare(a.last_updated));
  printProjectTable(projects);
  console.log('');
}
