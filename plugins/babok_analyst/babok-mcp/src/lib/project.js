import { customAlphabet } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateSuffix = customAlphabet(ALPHABET, 4);

export const STAGES = [
  { stage: 0, name: 'Project Charter' },
  { stage: 1, name: 'Project Initialization & Stakeholder Mapping' },
  { stage: 2, name: 'Current State Analysis (AS-IS)' },
  { stage: 3, name: 'Problem Domain Analysis' },
  { stage: 4, name: 'Solution Requirements Definition' },
  { stage: 5, name: 'Future State Design (TO-BE)' },
  { stage: 6, name: 'Gap Analysis & Implementation Roadmap' },
  { stage: 7, name: 'Risk Assessment & Mitigation Strategy' },
  { stage: 8, name: 'Business Case & ROI Model' },
];

export const STAGE_FILE_NAMES = {
  0: 'STAGE_00_Project_Charter.md',
  1: 'STAGE_01_Project_Initialization.md',
  2: 'STAGE_02_Current_State_Analysis.md',
  3: 'STAGE_03_Problem_Domain_Analysis.md',
  4: 'STAGE_04_Solution_Requirements.md',
  5: 'STAGE_05_Future_State_Design.md',
  6: 'STAGE_06_Gap_Analysis_Roadmap.md',
  7: 'STAGE_07_Risk_Assessment.md',
  8: 'STAGE_08_Business_Case_ROI.md',
};

export const STAGE_PROMPT_FILE_NAMES = {
  0: 'BABOK_agent_stage_0.md',
  1: 'BABOK_agent_stage_1.md',
  2: 'BABOK_agent_stage_2.md',
  3: 'BABOK_agent_stage_3.md',
  4: 'BABOK_agent_stage_4.md',
  5: 'BABOK_agent_stage_5.md',
  6: 'BABOK_agent_stage_6.md',
  7: 'BABOK_agent_stage_7.md',
  8: 'BABOK_agent_stage_8.md',
};

/**
 * Resolve the plugin install root when running as a Claude/Codex/Copilot plugin.
 * @returns {string|null}
 */
function getPluginRoot() {
  const moduleRoot = path.resolve(__dirname, '..', '..', '..');
  if (
    fs.existsSync(path.join(moduleRoot, '.codex-plugin', 'plugin.json'))
    || fs.existsSync(path.join(moduleRoot, '.claude-plugin', 'plugin.json'))
  ) {
    return moduleRoot;
  }

  const candidates = [
    process.env.BABOK_PLUGIN_ROOT,
    process.env.CLAUDE_PLUGIN_ROOT,
    process.env.PLUGIN_ROOT,
    process.env.CODEX_PLUGIN_ROOT,
    process.env.COPILOT_PLUGIN_ROOT,
  ];
  for (const candidate of candidates) {
    if (!candidate || candidate === '.') continue;
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }
  return null;
}

/**
 * Resolve the projects directory.
 * Priority:
 *   1. BABOK_PROJECTS_DIR env var
 *   2. CLAUDE_PROJECT_DIR/projects (plugin workspace)
 *   3. ./projects relative to CWD
 *   4. <plugin-root>/projects (when installed as marketplace plugin)
 *   5. ../projects relative to this package (dev checkout)
 */
export function getProjectsDir() {
  if (process.env.BABOK_PROJECTS_DIR && process.env.BABOK_PROJECTS_DIR !== '.') {
    return path.resolve(process.env.BABOK_PROJECTS_DIR);
  }
  if (process.env.CLAUDE_PROJECT_DIR) {
    return path.join(path.resolve(process.env.CLAUDE_PROJECT_DIR), 'projects');
  }
  if (process.env.CODEX_WORKSPACE_ROOT) {
    const fromCodex = findProjectsDirUpward(process.env.CODEX_WORKSPACE_ROOT);
    if (fromCodex) return fromCodex;
  }
  const cwdProjects = path.join(process.cwd(), 'projects');
  if (fs.existsSync(cwdProjects)) return cwdProjects;

  const fromCwd = findProjectsDirUpward(process.cwd());
  if (fromCwd) return fromCwd;

  const pluginRoot = getPluginRoot();
  if (pluginRoot) {
    const pluginProjects = path.join(pluginRoot, 'projects');
    return pluginProjects;
  }

  const relProjects = path.join(__dirname, '..', '..', 'projects');
  if (fs.existsSync(relProjects)) return relProjects;

  return cwdProjects; // fallback, will be created on first new_project
}

/**
 * Walk upward from a directory looking for a projects/ folder.
 * @param {string} startDir
 * @param {number} [maxDepth]
 * @returns {string|null}
 */
function findProjectsDirUpward(startDir, maxDepth = 8) {
  let dir = path.resolve(startDir);
  for (let depth = 0; depth < maxDepth; depth += 1) {
    for (const rel of ['projects', path.join('BABOK_ANALYST', 'projects')]) {
      const candidate = path.join(dir, rel);
      if (!fs.existsSync(candidate)) continue;
      const hasBabok = fs.readdirSync(candidate).some(
        (name) => name.startsWith('BABOK-') && fs.statSync(path.join(candidate, name)).isDirectory(),
      );
      if (hasBabok) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Resolve the BABOK_AGENT/stages directory for stage prompt files.
 * Priority:
 *   1. BABOK_AGENT_DIR env var
 *   2. <plugin-root>/BABOK_AGENT/stages (marketplace plugin install)
 *   3. ./BABOK_AGENT/stages relative to CWD
 *   4. ../BABOK_AGENT/stages relative to this package
 */
export function getAgentStagesDir() {
  if (process.env.BABOK_AGENT_DIR) {
    return path.resolve(process.env.BABOK_AGENT_DIR);
  }
  const pluginRoot = getPluginRoot();
  if (pluginRoot) {
    const pluginStages = path.join(pluginRoot, 'BABOK_AGENT', 'stages');
    if (fs.existsSync(pluginStages)) return pluginStages;
  }
  const cwdStages = path.join(process.cwd(), 'BABOK_AGENT', 'stages');
  if (fs.existsSync(cwdStages)) return cwdStages;

  const relStages = path.join(__dirname, '..', '..', 'BABOK_AGENT', 'stages');
  if (fs.existsSync(relStages)) return relStages;

  return null;
}

export function getProjectDir(projectId) {
  return path.join(getProjectsDir(), projectId);
}

export function getJournalPath(projectId) {
  return path.join(getProjectDir(projectId), `PROJECT_JOURNAL_${projectId}.json`);
}

export function generateProjectId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = generateSuffix();
  return `BABOK-${y}${m}${d}-${suffix}`;
}

export function listProjectIds() {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name =>
    name.startsWith('BABOK-') && fs.statSync(path.join(dir, name)).isDirectory()
  );
}

export function resolveProjectId(partialId) {
  const ids = listProjectIds();
  if (!partialId) return ids.length === 1 ? ids[0] : null;
  const exact = ids.find(id => id === partialId);
  if (exact) return exact;
  const upper = partialId.toUpperCase();
  const matches = ids.filter(id => id.includes(upper));
  return matches.length === 1 ? matches[0] : null;
}

/** Read stage prompt file content, returns null if not found */
export function getStagePrompt(stageN) {
  const stagesDir = getAgentStagesDir();
  if (!stagesDir) return null;
  const filename = STAGE_PROMPT_FILE_NAMES[stageN];
  if (!filename) return null;
  const filePath = path.join(stagesDir, filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** Read a stage deliverable MD file, returns null if not found */
export function getDeliverable(projectId, stageN) {
  const filename = STAGE_FILE_NAMES[stageN];
  if (!filename) return null;
  const filePath = path.join(getProjectDir(projectId), filename);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}
