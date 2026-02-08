import fs from 'fs';
import path from 'path';
import os from 'os';

const LANG_CONFIG_FILE = path.join(os.homedir(), '.babok_language');

const LANGUAGES = {
  EN: 'english',
  PL: 'polish'
};

/**
 * Get current language setting
 * @returns {string} 'EN' or 'PL'
 */
export function getCurrentLanguage() {
  try {
    if (fs.existsSync(LANG_CONFIG_FILE)) {
      const lang = fs.readFileSync(LANG_CONFIG_FILE, 'utf8').trim().toUpperCase();
      return lang === 'PL' ? 'PL' : 'EN';
    }
  } catch (err) {
    // Ignore error, return default
  }
  return 'EN'; // Default language
}

/**
 * Set language preference
 * @param {string} lang - 'EN' or 'PL'
 */
export function setLanguage(lang) {
  const normalized = lang.toUpperCase();
  if (normalized !== 'EN' && normalized !== 'PL') {
    throw new Error(`Invalid language: ${lang}. Use EN or PL.`);
  }
  fs.writeFileSync(LANG_CONFIG_FILE, normalized, 'utf8');
  return normalized;
}

/**
 * Get language name for display
 * @param {string} lang - 'EN' or 'PL'
 * @returns {string}
 */
export function getLanguageName(lang) {
  return LANGUAGES[lang] || LANGUAGES.EN;
}

/**
 * Get localized text
 * @param {string} key
 * @returns {string}
 */
export function getText(key) {
  const lang = getCurrentLanguage();
  const texts = {
    EN: {
      project_created: 'Project created successfully',
      project_name: 'Project name',
      language_set: 'Language set to',
      begin_new_project: 'BEGIN NEW PROJECT',
      default_language: 'Default language',
      current_language: 'Current language',
    },
    PL: {
      project_created: 'Projekt utworzony pomyślnie',
      project_name: 'Nazwa projektu',
      language_set: 'Język ustawiony na',
      begin_new_project: 'ZACZNIJ NOWY PROJEKT',
      default_language: 'Domyślny język',
      current_language: 'Obecny język',
    }
  };
  
  return texts[lang][key] || texts.EN[key] || key;
}

export { LANGUAGES };
