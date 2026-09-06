import chalk from 'chalk';
import readline from 'readline';
import { PROVIDERS, discoverProviderModels, getApiKey, storeKey } from '../llm.js';
import { getCurrentLanguage } from '../language.js';

/**
 * List all available LLM models and providers
 */
export async function listModels() {
  const lang = getCurrentLanguage();
  console.log('');
  console.log(chalk.bold.blue('🤖 Dostępne Modele LLM / Available LLM Models:'));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  for (const [key, info] of Object.entries(PROVIDERS)) {
    const hasKey = Boolean(getApiKey(key));
    const status = hasKey ? chalk.green('✓ KLUCZ USTAWIONY') : chalk.yellow('⚠ BRAK KLUCZA');
    const discovery = await discoverProviderModels(key, getApiKey(key));
    
    console.log(`${chalk.bold(info.name)} [${key}] - ${status}`);
    if (discovery.source === 'api') console.log(chalk.dim('  Modele dostępne dla tego klucza API:'));
    if (discovery.error) console.log(chalk.yellow(`  Nie udało się pobrać modeli z API: ${discovery.error.message}`));
    discovery.models.forEach(model => {
      const isDefault = model === info.defaultModel ? chalk.cyan(' (default)') : '';
      console.log(`  └─ ${model}${isDefault}`);
    });
    console.log('');
  }
}

/**
 * Change the active provider/model interactively
 */
export async function changeModel() {
  const lang = getCurrentLanguage();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const providers = Object.entries(PROVIDERS);
  
  console.log('\n  🔌 Wybierz dostawcę / Select provider:');
  providers.forEach(([key, info], i) => {
    console.log(`     ${i + 1}. ${info.name} [${key}]`);
  });

  const num = await new Promise(resolve => rl.question('\n  Wybierz numer (1-4): ', resolve));
  const idx = parseInt(num) - 1;

  if (isNaN(idx) || idx < 0 || idx >= providers.length) {
    console.log(chalk.red('\n  Błąd: Nieprawidłowy wybór.'));
    rl.close();
    return;
  }

  const [providerKey, info] = providers[idx];

  let apiKey = getApiKey(providerKey);
  if (!apiKey) {
    console.log(chalk.yellow(`\n  Klucz API dla ${info.name} nie został znaleziony.`));
    apiKey = (await new Promise(resolve => rl.question('  Podaj klucz API: ', resolve))).trim();
    if (!apiKey) {
      console.log(chalk.red('  Błąd: Klucz jest wymagany.'));
      rl.close();
      return;
    }
    storeKey(providerKey, apiKey);
  }

  const discovery = await discoverProviderModels(providerKey, apiKey);
  const availableModels = discovery.models;
  
  console.log(`\n  📝 Wybierz model dla ${info.name}:`);
  if (discovery.source === 'api') console.log(chalk.dim('     Modele dostępne dla podanego klucza API:'));
  if (discovery.error) console.log(chalk.yellow(`     Lista awaryjna: ${discovery.error.message}`));
  availableModels.forEach((m, i) => {
    console.log(`     ${i + 1}. ${m}`);
  });

  const mNum = await new Promise(resolve => rl.question('\n  Wybierz numer: ', resolve));
  const mIdx = parseInt(mNum) - 1;

  if (isNaN(mIdx) || mIdx < 0 || mIdx >= availableModels.length) {
    console.log(chalk.red('\n  Błąd: Nieprawidłowy wybór modelu.'));
    rl.close();
    return;
  }

  const selectedModel = availableModels[mIdx];
  rl.close();

  // We don't store the "active" model globally in a config file yet, 
  // but we provide the feedback. The user can use --provider and --model in chat.
  // Actually, let's suggest the command to use.
  
  console.log('\n' + chalk.green('✓') + chalk.bold(` Wybrano: ${info.name} - ${selectedModel}`));
  console.log(chalk.dim(`Aby użyć tego modelu, uruchom czat z parametrami:`));
  console.log(chalk.cyan(`babok chat <id> --provider ${providerKey} --model ${selectedModel}`));
  console.log('');
}
