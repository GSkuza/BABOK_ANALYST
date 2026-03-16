/**
 * babok setup
 * Interactive first-time configuration wizard.
 * Designed for non-technical analysts — no JSON editing required.
 *
 * Covers:
 *  1. Language preference (EN / PL)
 *  2. AI provider selection + API key entry (with browser-open hints)
 *  3. Quick connectivity test
 *  4. Optionally creates a first project
 */

import chalk from 'chalk';
import readline from 'readline';
import os from 'os';
import { setLanguage } from '../language.js';
import { PROVIDERS, storeKey, getApiKey, initializeProvider, sendMessageStream } from '../llm.js';
import { generateProjectId, getProjectDir } from '../project.js';
import { createJournal } from '../journal.js';
import { printProjectCreated } from '../display.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function banner(text) {
  const line = '═'.repeat(text.length + 4);
  console.log('');
  console.log(chalk.bold.cyan(`  ╔${line}╗`));
  console.log(chalk.bold.cyan(`  ║  ${text}  ║`));
  console.log(chalk.bold.cyan(`  ╚${line}╝`));
  console.log('');
}

function step(n, total, label) {
  console.log('');
  console.log(chalk.bold(`  [${n}/${total}] ${label}`));
  console.log(chalk.dim('  ' + '─'.repeat(50)));
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export async function setupWizard() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  banner('BABOK Agent — Kreator konfiguracji / Setup Wizard');

  console.log(chalk.dim(`  Komputer: ${os.hostname()} | Użytkownik: ${os.userInfo().username}`));
  console.log('');
  console.log('  Ten kreator skonfiguruje narzędzie w kilku prostych krokach.');
  console.log('  This wizard will configure the tool in a few simple steps.');
  console.log('');

  const TOTAL_STEPS = 4;

  // ── Step 1: Language ────────────────────────────────────────────────────────
  step(1, TOTAL_STEPS, 'Język interfejsu / Interface language');
  console.log('    1. Polski (PL)');
  console.log('    2. English (EN)');
  console.log('');

  let lang = '';
  while (!['1', '2', 'pl', 'en', 'PL', 'EN'].includes(lang)) {
    lang = await ask(rl, chalk.cyan('  Wybór / Choice [1/2]: '));
    if (!lang) lang = '1';
  }

  const language = (lang === '1' || lang.toLowerCase() === 'pl') ? 'PL' : 'EN';
  setLanguage(language);
  console.log(chalk.green(`  ✓ Język ustawiony: ${language}`));

  const isPL = language === 'PL';

  // ── Step 2: Provider selection ─────────────────────────────────────────────
  step(2, TOTAL_STEPS, isPL ? 'Wybór dostawcy AI' : 'AI provider selection');

  const providerList = Object.entries(PROVIDERS);
  console.log(isPL
    ? '  Wybierz dostawcę AI (potrzebujesz klucza API z jego strony):'
    : '  Choose your AI provider (you will need an API key from their website):');
  console.log('');

  providerList.forEach(([key, info], i) => {
    const hasKey = getApiKey(key) ? chalk.green(' [klucz zapisany]') : '';
    console.log(`    ${i + 1}. ${info.name}${hasKey}`);
    console.log(chalk.dim(`       ${isPL ? 'Klucz API' : 'API key'}: ${info.keyUrl}`));
  });
  console.log('');

  let providerChoice = '';
  while (!providerChoice) {
    const raw = await ask(rl, chalk.cyan(`  ${isPL ? 'Numer dostawcy' : 'Provider number'} [1-${providerList.length}]: `));
    const idx = parseInt(raw) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < providerList.length) {
      providerChoice = providerList[idx][0];
    } else {
      console.log(chalk.red(isPL ? '  Nieprawidłowy wybór.' : '  Invalid choice.'));
    }
  }

  const providerInfo = PROVIDERS[providerChoice];
  console.log('');
  console.log(isPL
    ? `  Wybrany dostawca: ${chalk.bold(providerInfo.name)}`
    : `  Selected provider: ${chalk.bold(providerInfo.name)}`);

  // ── Step 3: API Key entry ───────────────────────────────────────────────────
  step(3, TOTAL_STEPS, isPL ? 'Klucz API' : 'API Key');

  const existingKey = getApiKey(providerChoice);
  if (existingKey) {
    console.log(chalk.green(isPL
      ? `  ✓ Klucz API dla ${providerInfo.name} jest już zapisany (●●●●${existingKey.slice(-4)}).`
      : `  ✓ API key for ${providerInfo.name} is already saved (●●●●${existingKey.slice(-4)}).`
    ));

    const reenter = await ask(rl, chalk.cyan(isPL
      ? '  Czy chcesz wprowadzić nowy klucz? (t/N): '
      : '  Do you want to enter a new key? (y/N): '
    ));
    if (!['t', 'y', 'T', 'Y'].includes(reenter)) {
      console.log(chalk.dim(isPL ? '  Używam istniejącego klucza.' : '  Using existing key.'));
    } else {
      await enterAndSaveKey(rl, providerChoice, providerInfo, isPL);
    }
  } else {
    console.log(isPL
      ? `  Otwórz w przeglądarce: ${chalk.underline(providerInfo.keyUrl)}`
      : `  Open in browser: ${chalk.underline(providerInfo.keyUrl)}`
    );
    console.log(isPL
      ? '  Skopiuj klucz API i wklej go poniżej.'
      : '  Copy your API key and paste it below.'
    );
    console.log('');
    await enterAndSaveKey(rl, providerChoice, providerInfo, isPL);
  }

  // ── Step 4: First project (optional) ─────────────────────────────────────
  step(4, TOTAL_STEPS, isPL ? 'Pierwszy projekt (opcjonalnie)' : 'First project (optional)');
  console.log(isPL
    ? '  Czy chcesz teraz utworzyć pierwszy projekt analizy BABOK?'
    : '  Would you like to create your first BABOK analysis project now?');
  console.log('');

  const doCreate = await ask(rl, chalk.cyan(isPL ? '  Utwórz projekt? (t/N): ' : '  Create project? (y/N): '));
  if (['t', 'y', 'T', 'Y'].includes(doCreate)) {
    const defaultName = isPL ? 'Mój pierwszy projekt' : 'My first project';
    const projectName = await ask(rl, chalk.cyan(
      isPL ? `  Nazwa projektu [${defaultName}]: ` : `  Project name [${defaultName}]: `
    )) || defaultName;

    const projectId = generateProjectId();
    const projectDir = getProjectDir(projectId);
    createJournal(projectId, projectName, language);
    printProjectCreated(projectId, projectName, projectDir, language);

    console.log(isPL
      ? `\n  Następny krok: uruchom ${chalk.bold('babok chat ' + projectId)} aby zacząć pracę z AI.`
      : `\n  Next step: run ${chalk.bold('babok chat ' + projectId)} to start working with AI.`
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  rl.close();
  console.log('');
  console.log(chalk.bold.green(isPL
    ? '  ✓ Konfiguracja zakończona!'
    : '  ✓ Setup complete!'
  ));
  console.log(isPL
    ? '  Wpisz babok --help aby zobaczyć dostępne komendy.'
    : '  Type babok --help to see available commands.'
  );
  console.log('');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function enterAndSaveKey(rl, providerKey, providerInfo, isPL) {
  let apiKey = '';
  while (!apiKey) {
    apiKey = await ask(rl, chalk.cyan(isPL ? '  Wklej klucz API: ' : '  Paste API key: '));
    if (!apiKey) {
      console.log(chalk.red(isPL ? '  Klucz nie może być pusty.' : '  Key cannot be empty.'));
    }
  }

  storeKey(providerKey, apiKey);
  console.log(chalk.green(isPL
    ? `  ✓ Klucz API zapisany bezpiecznie (●●●●${apiKey.slice(-4)}).`
    : `  ✓ API key saved securely (●●●●${apiKey.slice(-4)}).`
  ));

  // Quick connectivity test
  console.log(chalk.dim(isPL ? '  Testowanie połączenia...' : '  Testing connection...'));
  try {
    await initializeProvider(providerKey, apiKey, providerInfo.defaultModel);
    let reply = '';
    await sendMessageStream('Reply with exactly: OK', chunk => { reply += chunk; });
    if (reply.trim().toUpperCase().includes('OK')) {
      console.log(chalk.green(isPL ? '  ✓ Połączenie działa poprawnie.' : '  ✓ Connection successful.'));
    } else {
      console.log(chalk.yellow(isPL
        ? '  ⚠ Klucz zapisany, ale odpowiedź AI była nieoczekiwana. Sprawdź klucz ręcznie.'
        : '  ⚠ Key saved, but AI response was unexpected. Verify the key manually.'
      ));
    }
  } catch (err) {
    console.log(chalk.yellow(isPL
      ? `  ⚠ Nie udało się przetestować połączenia: ${err.message}`
      : `  ⚠ Could not test connection: ${err.message}`
    ));
    console.log(chalk.dim(isPL ? '  Klucz został zapisany mimo to.' : '  Key was saved anyway.'));
  }
}
