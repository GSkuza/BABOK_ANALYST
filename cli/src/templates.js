/**
 * Template loader — reads templates/manifest.json and injects stage skeletons + modules.
 * Shared by CLI (run.js) and can be mirrored in babok-mcp.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveProfilePath } from './profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the templates/ directory. With a profile, uses profile.paths.templates_dir;
 * otherwise falls back to the workspace root or package-relative default templates.
 * @param {object|null} [profile]
 * @returns {string}
 */
export function resolveTemplatesDir(profile = null) {
  if (profile) return resolveProfilePath(profile, 'templates_dir');
  const candidates = [
    path.join(process.cwd(), 'templates'),
    path.join(__dirname, '..', '..', 'templates'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'manifest.json'))) {
      return dir;
    }
  }
  return candidates[1];
}

/**
 * Load templates/manifest.json.
 * @param {string} [templatesDir]
 * @returns {object}
 */
export function loadManifest(templatesDir = resolveTemplatesDir()) {
  const manifestPath = path.join(templatesDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Template manifest not found: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

/**
 * Load quality scoring rubric for required_sections lookup.
 * @param {object|null} [profile]
 * @returns {object|null}
 */
export function loadRubric(profile = null) {
  const candidates = profile
    ? [resolveProfilePath(profile, 'rubric')]
    : [
      path.join(process.cwd(), 'BABOK_AGENT', 'agents', 'quality_scoring_rubric.json'),
      path.join(resolveTemplatesDir(), '..', 'BABOK_AGENT', 'agents', 'quality_scoring_rubric.json'),
      path.join(__dirname, '..', '..', 'BABOK_AGENT', 'agents', 'quality_scoring_rubric.json'),
    ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  }
  return null;
}

/**
 * Determine industry pack from project context.
 * @param {object|null} projectContext
 * @param {object} manifest
 * @returns {string|null}
 */
export function resolveIndustryPack(projectContext, manifest) {
  if (!projectContext) return null;

  const explicit = projectContext.industry_pack;
  if (explicit && explicit !== 'none') {
    return explicit;
  }

  const industry = projectContext.company?.industry || '';
  const triggers = manifest.industry_triggers || {};
  for (const [pack, values] of Object.entries(triggers)) {
    if (values.some(v => industry.toLowerCase().includes(String(v).toLowerCase()))) {
      return pack;
    }
  }

  const compliance = projectContext.compliance || [];
  if (compliance.some(c => /gdpr|ksef/i.test(c))) {
    return 'compliance';
  }

  return null;
}

/**
 * Read a template file relative to templatesDir.
 * @param {string} templatesDir
 * @param {string} relativePath
 * @returns {string|null}
 */
export function readTemplateFile(templatesDir, relativePath) {
  const filePath = path.join(templatesDir, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Load primary + module templates for a stage as LLM injection text.
 * @param {number} stageNum - Stage number within the profile
 * @param {{ includeModules?: boolean, projectContext?: object|null, profile?: object|null }} [options]
 * @returns {{ text: string, requiredSections: string[], files: string[], primary: string|null }}
 */
export function loadTemplatesForStage(stageNum, options = {}) {
  const { includeModules = true, projectContext = null, profile = null } = options;
  const templatesDir = resolveTemplatesDir(profile);
  const manifest = loadManifest(templatesDir);
  const stageKey = String(stageNum);
  const stageConfig = manifest.stages?.[stageKey];

  if (!stageConfig) {
    return { text: '', requiredSections: [], files: [], primary: null };
  }

  const fileList = [stageConfig.primary];
  if (includeModules && Array.isArray(stageConfig.modules)) {
    fileList.push(...stageConfig.modules);
  }

  if (includeModules) {
    const pack = resolveIndustryPack(projectContext, manifest);
    const supplements = pack
      ? manifest.industry_supplements?.[pack]?.[stageKey] || []
      : [];
    fileList.push(...supplements);
  }

  const uniqueFiles = [...new Set(fileList)];
  const parts = [];
  const loaded = [];

  for (const rel of uniqueFiles) {
    const content = readTemplateFile(templatesDir, rel);
    if (content) {
      loaded.push(rel);
      const name = path.basename(rel);
      parts.push(`\n\n=== OUTPUT TEMPLATE: ${name} ===\n${content}\n=== END TEMPLATE ===`);
    }
  }

  const rubric = loadRubric(profile);
  const rubricKey = stageNum === 0 ? null : `stage${stageNum}`;
  const requiredSections = rubricKey && rubric?.stages?.[rubricKey]
    ? rubric.stages[rubricKey].required_sections || []
    : [];

  return {
    text: parts.join(''),
    requiredSections,
    files: loaded,
    primary: stageConfig.primary,
  };
}

/**
 * Structured template payload for MCP/API consumers.
 * @param {number} stageNum
 * @param {{ includeModules?: boolean, projectContext?: object|null, profile?: object|null }} [options]
 */
export function getStageTemplatePayload(stageNum, options = {}) {
  const { includeModules = true, projectContext = null, profile = null } = options;
  const templatesDir = resolveTemplatesDir(profile);
  const manifest = loadManifest(templatesDir);
  const stageKey = String(stageNum);
  const stageConfig = manifest.stages?.[stageKey];

  if (!stageConfig) {
    throw new Error(`No template configured for stage ${stageNum}`);
  }

  const { text, requiredSections, files } = loadTemplatesForStage(stageNum, {
    includeModules,
    projectContext,
    profile,
  });

  const primaryContent = readTemplateFile(templatesDir, stageConfig.primary);

  return {
    stage: stageNum,
    deliverable_file: stageConfig.deliverable_file,
    primary: stageConfig.primary,
    primary_content: primaryContent,
    modules: (stageConfig.modules || []).filter(m => files.includes(m)),
    industry_supplements: files.filter(
      f => f.startsWith('industry/') && !stageConfig.modules?.includes(f)
    ),
    required_sections: requiredSections,
    combined_text: text,
  };
}
