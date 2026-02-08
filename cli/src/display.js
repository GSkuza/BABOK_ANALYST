import chalk from 'chalk';

const STATUS_ICONS = {
  not_started: '\u23F8\uFE0F ',
  in_progress: '\uD83D\uDD04',
  completed: '\u2705',
  approved: '\u2705',
  rejected: '\u274C',
};

const STATUS_LABELS = {
  not_started: 'NOT STARTED',
  in_progress: 'IN PROGRESS',
  completed: 'COMPLETED',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

export function stageIcon(status) {
  return STATUS_ICONS[status] || '  ';
}

export function stageLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function line(char = '\u2501', len = 40) {
  return char.repeat(len);
}

export function header(text) {
  console.log('');
  console.log(chalk.bold.cyan(text));
  console.log(chalk.dim(line()));
}

export function keyValue(key, value) {
  console.log(`  ${chalk.gray(key.padEnd(16))} ${value}`);
}

export function printProjectCreated(projectId, projectName, projectDir, language = 'EN') {
  const texts = {
    EN: {
      created: 'NEW PROJECT CREATED',
      projectId: 'Project ID:',
      projectName: 'Project Name:',
      createdAt: 'Created:',
      directory: 'Directory:',
      journal: 'Journal:',
      saveId: 'Save this Project ID to resume later:',
      nextStep: 'Next step: Open your AI chat and type:',
      beginProject: 'BEGIN NEW PROJECT',
      provideId: 'Then provide the Project ID:',
      language: 'Language:',
    },
    PL: {
      created: 'UTWORZONO NOWY PROJEKT',
      projectId: 'ID Projektu:',
      projectName: 'Nazwa Projektu:',
      createdAt: 'Utworzono:',
      directory: 'Katalog:',
      journal: 'Dziennik:',
      saveId: 'Zapisz ten ID projektu, aby wznowić później:',
      nextStep: 'Następny krok: Otwórz czat AI i wpisz:',
      beginProject: 'ZACZNIJ NOWY PROJEKT',
      provideId: 'Następnie podaj ID Projektu:',
      language: 'Język:',
    }
  };
  
  const t = texts[language] || texts.EN;
  
  console.log('');
  console.log(chalk.bold.green(`✅ ${t.created}`));
  console.log(chalk.dim(line()));
  keyValue(t.projectId, chalk.bold.white(projectId));
  keyValue(t.projectName, projectName);
  keyValue(t.language, language === 'PL' ? 'Polski' : 'English');
  keyValue(t.createdAt, new Date().toISOString());
  keyValue(t.directory, projectDir);
  keyValue(t.journal, `PROJECT_JOURNAL_${projectId}.json`);
  console.log(chalk.dim(line()));
  console.log('');
  console.log(chalk.yellow(`${t.saveId} ${chalk.bold(projectId)}`));
  console.log('');
  console.log(chalk.dim(t.nextStep));
  console.log(chalk.bold.white(`  ${t.beginProject}`));
  console.log(chalk.dim(`  ${t.provideId} ${projectId}`));
  console.log('');
}

export function printStageList(stages) {
  for (const s of stages) {
    const icon = stageIcon(s.status);
    const label = stageLabel(s.status);
    const date = s.approved_at
      ? chalk.dim(` (${s.approved_at.slice(0, 10)})`)
      : s.started_at
        ? chalk.dim(` (started ${s.started_at.slice(0, 10)})`)
        : '';

    const statusColor =
      s.status === 'approved' ? chalk.green :
      s.status === 'in_progress' ? chalk.yellow :
      s.status === 'rejected' ? chalk.red :
      chalk.dim;

    console.log(
      `  ${chalk.dim(`Stage ${s.stage}:`)} ${icon} ${statusColor(label)}${date}`
    );
    if (s.notes) {
      console.log(`           ${chalk.dim(s.notes)}`);
    }
  }
}

export function printProjectTable(projects) {
  if (projects.length === 0) {
    console.log(chalk.dim('  No projects found.'));
    return;
  }

  const idW = 22;
  const nameW = 30;
  const stageW = 10;
  const statusW = 14;

  console.log(
    chalk.bold(
      `  ${'ID'.padEnd(idW)} ${'Name'.padEnd(nameW)} ${'Stage'.padEnd(stageW)} ${'Status'.padEnd(statusW)} Last Updated`
    )
  );
  console.log(chalk.dim(`  ${line('-', idW + nameW + stageW + statusW + 14)}`));

  for (const p of projects) {
    const name = p.project_name.length > nameW - 2
      ? p.project_name.slice(0, nameW - 5) + '...'
      : p.project_name;
    const stage = `${p.current_stage}/8`;
    const status = stageLabel(p.current_status);
    const updated = p.last_updated.slice(0, 10);

    console.log(
      `  ${chalk.cyan(p.project_id.padEnd(idW))} ${name.padEnd(nameW)} ${stage.padEnd(stageW)} ${status.padEnd(statusW)} ${chalk.dim(updated)}`
    );
  }
}
