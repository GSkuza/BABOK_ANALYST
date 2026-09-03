import { nanoid, customAlphabet } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DEFAULT_PROFILE_ID, buildProjectIdRegex, getStages, loadProfile } from './profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateSuffix = customAlphabet(ALPHABET, 4);

// Default-profile stage list; kept for backward compatibility with existing imports.
const STAGES = getStages(loadProfile(DEFAULT_PROFILE_ID));

export { STAGES };

export function getProjectsDir() {
  // 1. Check current working directory
  const cwdProjects = path.join(process.cwd(), 'projects');
  if (fs.existsSync(cwdProjects)) return cwdProjects;

  // 2. Check workspace root (relative to this script: src/project.js -> cli/src/project.js -> D:/BABOK_ANALYST/projects)
  const rootProjects = path.join(__dirname, '..', '..', 'projects');
  if (fs.existsSync(rootProjects)) return rootProjects;

  // Fallback to CWD
  return cwdProjects;
}

export function getProjectDir(projectId) {
  return path.join(getProjectsDir(), projectId);
}

export function getJournalPath(projectId) {
  return path.join(getProjectDir(projectId), `PROJECT_JOURNAL_${projectId}.json`);
}

/**
 * @param {string|object} [profile] profile id or loaded profile object
 */
export function generateProjectId(profile = DEFAULT_PROFILE_ID) {
  const p = typeof profile === 'string' ? loadProfile(profile) : profile;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = generateSuffix();
  return `${p.id_prefix}-${y}${m}${d}-${suffix}`;
}

export function listProjectIds() {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return [];
  const idRe = buildProjectIdRegex();
  return fs.readdirSync(dir).filter(name =>
    idRe.test(name) && fs.statSync(path.join(dir, name)).isDirectory()
  );
}

export function resolveProjectId(partialId) {
  const ids = listProjectIds();
  if (!partialId) return ids.length === 1 ? ids[0] : null;
  const exact = ids.find(id => id === partialId);
  if (exact) return exact;
  const matches = ids.filter(id => id.includes(partialId.toUpperCase()));
  return matches.length === 1 ? matches[0] : null;
}
