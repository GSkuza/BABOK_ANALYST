/**
 * Pipeline profile loader.
 *
 * A profile declares the stage shape, project-ID prefix, prompt/template/rubric
 * locations, validation-rule bindings and autonomous pipeline for one analysis
 * mode (see profiles/profile.schema.json). The `babok` profile describes the
 * original BABOK v3 pipeline; other profiles (e.g. `consulting`) live beside it.
 *
 * This file is byte-identical in cli/src/profiles.js and
 * babok-mcp/src/lib/profiles.js (enforced by tests/unit/lib-parity.test.js),
 * so it must not import anything package-specific and must locate profiles/
 * by walking upward from its own location.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const DEFAULT_PROFILE_ID = 'babok';

// IDs are <PREFIX>-YYYYMMDD-XXXX, but `babok run` also emits <PREFIX>-<TITLE_SLUG>-YYYYMMDD-XXXX,
// so matching is by prefix (the legacy `startsWith('BABOK-')` semantics), not by full shape.
const ID_BODY_RE = '[A-Z0-9_-]+';
const PLUGIN_ROOT_ENVS = [
  'BABOK_PLUGIN_ROOT',
  'CLAUDE_PLUGIN_ROOT',
  'PLUGIN_ROOT',
  'CODEX_PLUGIN_ROOT',
  'COPILOT_PLUGIN_ROOT',
];

let _profilesDirCache = null;
const _profileCache = new Map();

function isProfilesDir(dir) {
  return fs.existsSync(path.join(dir, 'profile.schema.json'));
}

/**
 * Locate the profiles/ directory.
 * Priority: BABOK_PROFILES_DIR → upward walk from this module → <plugin-root>/profiles → ./profiles
 * @returns {string}
 */
export function getProfilesDir() {
  if (_profilesDirCache && isProfilesDir(_profilesDirCache)) return _profilesDirCache;

  const candidates = [];
  if (process.env.BABOK_PROFILES_DIR && process.env.BABOK_PROFILES_DIR !== '.') {
    candidates.push(path.resolve(process.env.BABOK_PROFILES_DIR));
  }
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 6; depth += 1) {
    candidates.push(path.join(dir, 'profiles'));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  for (const env of PLUGIN_ROOT_ENVS) {
    const value = process.env[env];
    if (value && value !== '.') candidates.push(path.join(path.resolve(value), 'profiles'));
  }
  candidates.push(path.join(process.cwd(), 'profiles'));

  for (const candidate of candidates) {
    if (isProfilesDir(candidate)) {
      _profilesDirCache = candidate;
      return candidate;
    }
  }
  throw new Error('profiles/ directory not found. Set BABOK_PROFILES_DIR to the directory containing profile.schema.json.');
}

/** Root against which profile.paths.* are resolved (parent of profiles/). */
export function getProfilesRoot() {
  return path.dirname(getProfilesDir());
}

/** @returns {string[]} profile ids (directories containing profile.json), default first */
export function listProfileIds() {
  const dir = getProfilesDir();
  const ids = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'profile.json')))
    .map(e => e.name)
    .sort();
  const i = ids.indexOf(DEFAULT_PROFILE_ID);
  if (i > 0) ids.splice(0, 0, ...ids.splice(i, 1));
  return ids;
}

/**
 * Structural validation beyond what JSON parsing gives us. Throws on the first problem.
 * @param {object} profile
 * @param {string} [expectedId]
 */
export function validateProfile(profile, expectedId) {
  const where = `profile ${profile?.id ?? expectedId ?? '?'}`;
  for (const key of ['id', 'name', 'id_prefix', 'stages', 'paths', 'scoring', 'validation', 'orchestrator']) {
    if (profile[key] === undefined) throw new Error(`${where}: missing "${key}"`);
  }
  if (expectedId && profile.id !== expectedId) throw new Error(`${where}: id "${profile.id}" does not match directory "${expectedId}"`);
  if (!/^[A-Z][A-Z0-9]{1,7}$/.test(profile.id_prefix)) throw new Error(`${where}: invalid id_prefix "${profile.id_prefix}"`);
  if (!Array.isArray(profile.stages) || profile.stages.length < 2) throw new Error(`${where}: stages must list at least 2 entries`);
  profile.stages.forEach((s, i) => {
    if (s.stage !== i) throw new Error(`${where}: stages must be contiguous from 0 (index ${i} has stage ${s.stage})`);
    for (const key of ['name', 'deliverable_file', 'prompt_file']) {
      if (typeof s[key] !== 'string' || !s[key]) throw new Error(`${where}: stage ${i} missing "${key}"`);
    }
    const expectedPrefix = `STAGE_${String(i).padStart(2, '0')}_`;
    if (!s.deliverable_file.startsWith(expectedPrefix)) throw new Error(`${where}: stage ${i} deliverable_file must start with ${expectedPrefix}`);
  });
  for (const key of ['stages_dir', 'system_prompt', 'templates_dir', 'rubric', 'agents_dir']) {
    if (typeof profile.paths[key] !== 'string') throw new Error(`${where}: paths.${key} missing`);
  }
  const max = profile.stages.length - 1;
  for (const n of profile.scoring.scorable_stages ?? []) {
    if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${where}: scorable stage ${n} out of range 0..${max}`);
  }
  for (const rule of profile.validation.rules ?? []) {
    if (typeof rule.id !== 'string') throw new Error(`${where}: validation rule without id`);
    for (const [role, n] of Object.entries(rule.bindings ?? {})) {
      if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${where}: rule ${rule.id} binding ${role}=${n} out of range 0..${max}`);
    }
  }
  for (const group of profile.orchestrator.pipeline ?? []) {
    if (!['sequential', 'parallel'].includes(group.type)) throw new Error(`${where}: pipeline group type "${group.type}" invalid`);
    for (const key of group.stages ?? []) {
      const m = /^stage(\d+)/.exec(key);
      if (!m || Number(m[1]) > max) throw new Error(`${where}: pipeline stage key "${key}" does not map to a stage 0..${max}`);
    }
  }
  for (const n of profile.orchestrator.deep_analysis_stages ?? []) {
    if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${where}: deep_analysis stage ${n} out of range 0..${max}`);
  }
}

/**
 * @param {string} [profileId]
 * @returns {object} frozen profile object
 */
export function loadProfile(profileId = DEFAULT_PROFILE_ID) {
  const id = profileId || DEFAULT_PROFILE_ID;
  if (_profileCache.has(id)) return _profileCache.get(id);
  const filePath = path.join(getProfilesDir(), id, 'profile.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Unknown profile "${id}". Available: ${listProfileIds().join(', ')}`);
  }
  const profile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  validateProfile(profile, id);
  Object.freeze(profile);
  _profileCache.set(id, profile);
  return profile;
}

/** Drop caches (tests that change BABOK_PROFILES_DIR). */
export function resetProfileCache() {
  _profilesDirCache = null;
  _profileCache.clear();
}

/**
 * Absolute path for one of profile.paths.* (or any root-relative path).
 * @param {object} profile
 * @param {string} relOrKey - key in profile.paths, or a root-relative path
 */
export function resolveProfilePath(profile, relOrKey) {
  const rel = profile.paths[relOrKey] ?? relOrKey;
  return path.isAbsolute(rel) ? rel : path.join(getProfilesRoot(), rel);
}

export function getStages(profile) {
  return profile.stages.map(s => ({ stage: s.stage, name: s.name }));
}

export function getStage(profile, stageNumber) {
  return profile.stages.find(s => s.stage === Number(stageNumber)) ?? null;
}

export function getMaxStage(profile) {
  return profile.stages.length - 1;
}

export function isValidStage(profile, stageNumber) {
  const n = Number(stageNumber);
  return Number.isInteger(n) && n >= 0 && n <= getMaxStage(profile);
}

/** @returns {Record<number,string>} stage number → deliverable filename */
export function getStageFileNames(profile) {
  return Object.fromEntries(profile.stages.map(s => [s.stage, s.deliverable_file]));
}

/** @returns {Record<number,string>} stage number → prompt filename */
export function getStagePromptFileNames(profile) {
  return Object.fromEntries(profile.stages.map(s => [s.stage, s.prompt_file]));
}

export function getIdPrefixes() {
  return listProfileIds().map(id => loadProfile(id).id_prefix);
}

/** Regex matching a project ID of any known profile (by prefix). */
export function buildProjectIdRegex() {
  return new RegExp(`^(${getIdPrefixes().join('|')})-${ID_BODY_RE}$`);
}

export function isProjectId(name) {
  return typeof name === 'string' && buildProjectIdRegex().test(name);
}

/**
 * @param {string} projectId
 * @returns {string|null} profile id whose prefix matches, or null
 */
export function profileIdFromProjectId(projectId) {
  if (typeof projectId !== 'string') return null;
  const prefix = projectId.split('-')[0];
  for (const id of listProfileIds()) {
    if (loadProfile(id).id_prefix === prefix) return id;
  }
  return null;
}

/**
 * Profile for an existing journal: explicit `profile` field, else prefix, else default.
 * @param {{ profile?: string, project_id?: string }} journal
 */
export function profileIdFromJournal(journal) {
  return journal?.profile || profileIdFromProjectId(journal?.project_id) || DEFAULT_PROFILE_ID;
}
