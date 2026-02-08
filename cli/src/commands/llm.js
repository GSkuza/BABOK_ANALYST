import chalk from 'chalk';
import readline from 'readline';
import { PROVIDERS, getApiKey, storeKey, listStoredProviders } from '../llm.js';
import { getCurrentLanguage } from '../language.js';

/**
 * List all available LLM models and providers
 */
export function listModels() {
  const lang = getCurrentLanguage();
  console.log('');
  console.log(chalk.bold.blue('🤖 Dostępne Modele LLM / Available LLM Models:'));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

  const stored = listStoredProviders();

  Object.entries(PROVIDERS).forEach(([key, info]) => {
    const hasKey = stored.includes(key);
    const status = hasKey ? chalk.green('✓ KLUCZ OK') : chalk.yellow('⚠ BRAK KLUCZA');
    
    console.log(`${chalk.bold(info.name)} [${key}] - ${status}`);
    info.models.forEach(model => {
      const isDefault = model === info.defaultModel ? chalk.cyan(' (default)') : '';
      console.log(`  └─ ${model}${isDefault}`);
    });
    console.log('');
  });
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
  
  console.log(`\n  📝 Wybierz model dla ${info.name}:`);
  info.models.forEach((m, i) => {
    console.log(`     ${i + 1}. ${m}`);
  });

  const mNum = await new Promise(resolve => rl.question('\n  Wybierz numer: ', resolve));
  const mIdx = parseInt(mNum) - 1;

  if (isNaN(mIdx) || mIdx < 0 || mIdx >= info.models.length) {
    console.log(chalk.red('\n  Błąd: Nieprawidłowy wybór modelu.'));
    rl.close();
    return;
  }

  const selectedModel = info.models[mIdx];
  rl.close();

  // We don't store the "active" model globally in a config file yet, 
  // but we provide the feedback. The user can use --provider and --model in chat.
  // Actually, let's suggest the command to use.
  
  console.log('\n' + chalk.green('✓') + chalk.bold(` Wybrano: ${info.name} - ${selectedModel}`));
  console.log(chalk.dim(`Aby użyć tego modelu, uruchom czat z parametrami:`));
  console.log(chalk.cyan(`babok chat <id> --provider ${providerKey} --model ${selectedModel}`));
  console.log('');
}
