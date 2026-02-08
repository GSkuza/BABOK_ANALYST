import chalk from 'chalk';
import { setLanguage, getCurrentLanguage, getLanguageName } from '../language.js';

/**
 * Set language command
 * BABOK PL - sets Polish
 * BABOK ENG - sets English
 */
export function setLanguageCommand(lang) {
  try {
    const normalized = lang.toUpperCase() === 'ENG' ? 'EN' : lang.toUpperCase();
    const newLang = setLanguage(normalized);
    const langName = getLanguageName(newLang);
    
    console.log('');
    console.log(chalk.green('✓'), chalk.bold(`Language set to: ${langName.toUpperCase()} (${newLang})`));
    console.log('');
    console.log(chalk.dim('Commands available:'));
    
    if (newLang === 'EN') {
      console.log(chalk.dim('  - BEGIN NEW PROJECT (starts new project in English)'));
      console.log(chalk.dim('  - babok new          (creates new project)'));
    } else {
      console.log(chalk.dim('  - ZACZNIJ NOWY PROJEKT (rozpoczyna nowy projekt po polsku)'));
      console.log(chalk.dim('  - babok new            (tworzy nowy projekt)'));
    }
    console.log('');
    
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

/**
 * Show current language
 */
export function showLanguage() {
  const lang = getCurrentLanguage();
  const langName = getLanguageName(lang);
  
  console.log('');
  console.log(chalk.bold('Current Language:'), chalk.cyan(`${langName.toUpperCase()} (${lang})`));
  console.log('');
  console.log(chalk.dim('To change language:'));
  console.log(chalk.dim('  babok lang EN   - Set to English'));
  console.log(chalk.dim('  babok lang PL   - Set to Polish'));
  console.log('');
}
