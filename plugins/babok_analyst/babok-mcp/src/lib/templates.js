/**
 * Template loader for MCP server — mirrors cli/src/templates.js.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveProfilePath } from './profiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve templates/ directory. With a profile, uses profile.paths.templates_dir;
 * otherwise plugin root or env.
 * @param {object|null} [profile]
 * @returns {string}
 */
export function resolveTemplatesDir(profile = null) {
  if (profile) return resolveProfilePath(profile, 'templates_dir');
  const moduleRoot = path.resolve(__dirname, '..', '..', '..');
  const candidates = [
    process.env.BABOK_TEMPLATES_DIR,
    path.join(process.cwd(), 'templates'),
    path.join(moduleRoot, 'templates'),
  ].filter(Boolean);

  for (const dir of candidates) {
    const resolved = path.resolve(dir);
    if (fs.existsSync(path.join(resolved, 'manifest.json'))) {
      return resolved;
    }
  }
  return path.join(moduleRoot, 'templates');
}

export function loadManifest(templatesDir = resolveTemplatesDir()) {
  const manifestPath = path.join(templatesDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Template manifest not found: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

export function loadRubric(templatesDir = resolveTemplatesDir(), profile = null) {
  const rubricPath = profile
    ? resolveProfilePath(profile, 'rubric')
    : path.join(path.resolve(templatesDir, '..'), 'BABOK_AGENT', 'agents', 'quality_scoring_rubric.json');
  if (!fs.existsSync(rubricPath)) return null;
  return JSON.parse(fs.readFileSync(rubricPath, 'utf-8'));
}

export function resolveIndustryPack(projectContext, manifest) {
  if (!projectContext) return null;
  const explicit = projectContext.industry_pack;
  if (explicit && explicit !== 'none') return explicit;

  const industry = projectContext.company?.industry || '';
  for (const [pack, values] of Object.entries(manifest.industry_triggers || {})) {
    if (values.some(v => industry.toLowerCase().includes(String(v).toLowerCase()))) {
      return pack;
    }
  }
  if ((projectContext.compliance || []).some(c => /gdpr|ksef/i.test(c))) {
    return 'compliance';
  }
  return null;
}

function readTemplateFile(templatesDir, relativePath) {
  const filePath = path.join(templatesDir, relativePath);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/**
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

  const fileList = [stageConfig.primary];
  if (includeModules && stageConfig.modules) fileList.push(...stageConfig.modules);

  const pack = includeModules ? resolveIndustryPack(projectContext, manifest) : null;
  if (pack) {
    fileList.push(...(manifest.industry_supplements?.[pack]?.[stageKey] || []));
  }

  const uniqueFiles = [...new Set(fileList)];
  const parts = [];
  const loaded = [];

  for (const rel of uniqueFiles) {
    const content = readTemplateFile(templatesDir, rel);
    if (content) {
      loaded.push(rel);
      parts.push(`\n\n=== OUTPUT TEMPLATE: ${path.basename(rel)} ===\n${content}\n=== END TEMPLATE ===`);
    }
  }

  const rubric = loadRubric(templatesDir, profile);
  const rubricKey = stageNum === 0 ? null : `stage${stageNum}`;
  const requiredSections = rubricKey && rubric?.stages?.[rubricKey]
    ? rubric.stages[rubricKey].required_sections || []
    : [];

  return {
    stage: stageNum,
    deliverable_file: stageConfig.deliverable_file,
    primary: stageConfig.primary,
    primary_content: readTemplateFile(templatesDir, stageConfig.primary),
    modules: (stageConfig.modules || []).filter(m => loaded.includes(m)),
    industry_supplements: loaded.filter(f => f.startsWith('industry/')),
    required_sections: requiredSections,
    combined_text: parts.join(''),
    template_files: loaded,
  };
}
