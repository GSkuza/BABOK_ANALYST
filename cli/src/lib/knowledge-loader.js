import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// knowledge dir is 3 levels up from cli/src/lib/
const KNOWLEDGE_DIR = path.join(__dirname, '..', '..', '..', 'knowledge');

/**
 * List all .json files in a category directory (recursively).
 * Returns relative keys like 'manufacturing' or 'einvoicing/poland_ksef'.
 * @param {string} categoryDir - Absolute path to category directory
 * @param {string} [base=''] - Internal recursion base for building relative key
 * @returns {string[]}
 */
function listCategoryKeys(categoryDir, base = '') {
  if (!fs.existsSync(categoryDir)) return [];
  const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
  const keys = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      keys.push(...listCategoryKeys(path.join(categoryDir, entry.name), rel));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      keys.push(rel.replace(/\.json$/, ''));
    }
  }
  return keys;
}

/**
 * Load a knowledge file by category and key.
 * @param {string} category - e.g. 'industries', 'regulations', 'benchmarks', 'technology', 'anti_patterns'
 * @param {string} key - e.g. 'manufacturing', 'gdpr_checklist', 'einvoicing/poland_ksef'
 * @returns {object} parsed JSON content of the knowledge file
 * @throws {Error} if the file does not exist, listing available keys
 */
export function loadKnowledge(category, key) {
  const filePath = path.join(KNOWLEDGE_DIR, category, `${key}.json`);
  if (!fs.existsSync(filePath)) {
    const available = listCategoryKeys(path.join(KNOWLEDGE_DIR, category));
    const availableStr = available.length > 0 ? available.join(', ') : '(none)';
    throw new Error(
      `Knowledge not found: ${category}/${key}. Available: ${availableStr}`
    );
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Mapping from short regulation keys to knowledge file paths within 'regulations/'.
 */
const REGULATION_KEY_MAP = {
  gdpr: 'gdpr_checklist',
  iso27001: 'iso27001',
  ksef: 'einvoicing/poland_ksef',
  xrechnung: 'einvoicing/germany_xrechnung',
  // Aliases
  gdpr_checklist: 'gdpr_checklist',
  poland_ksef: 'einvoicing/poland_ksef',
  germany_xrechnung: 'einvoicing/germany_xrechnung',
};

/**
 * Safely try to load a knowledge file; returns null on failure instead of throwing.
 * @param {string} category
 * @param {string} key
 * @returns {object|null}
 */
function tryLoadKnowledge(category, key) {
  try {
    return loadKnowledge(category, key);
  } catch {
    return null;
  }
}

/**
 * Get relevant knowledge files based on project context.
 * @param {{
 *   industry?: string,
 *   regulations?: string[],
 *   benchmarks?: string[],
 *   technology?: string[]
 * }} projectContext
 * @returns {{
 *   industries: object[],
 *   regulations: object[],
 *   benchmarks: object[],
 *   technology: object[]
 * }}
 */
export function getRelevantKnowledge(projectContext = {}) {
  const result = {
    industries: [],
    regulations: [],
    benchmarks: [],
    technology: [],
  };

  // Load industry knowledge
  if (projectContext.industry) {
    const industryKey = projectContext.industry.toLowerCase().replace(/\s+/g, '_');
    const data = tryLoadKnowledge('industries', industryKey);
    if (data) result.industries.push(data);
  }

  // Load regulation knowledge with short-key resolution
  if (Array.isArray(projectContext.regulations)) {
    for (const reg of projectContext.regulations) {
      const normalizedKey = reg.toLowerCase().replace(/\s+/g, '_');
      const resolvedKey = REGULATION_KEY_MAP[normalizedKey] || normalizedKey;
      const data = tryLoadKnowledge('regulations', resolvedKey);
      if (data) result.regulations.push(data);
    }
  }

  // Load benchmark knowledge
  if (Array.isArray(projectContext.benchmarks)) {
    for (const bench of projectContext.benchmarks) {
      const benchKey = bench.toLowerCase().replace(/\s+/g, '_');
      const data = tryLoadKnowledge('benchmarks', benchKey);
      if (data) result.benchmarks.push(data);
    }
  }

  // Load technology knowledge
  if (Array.isArray(projectContext.technology)) {
    for (const tech of projectContext.technology) {
      const techKey = tech.toLowerCase().replace(/\s+/g, '_');
      const data = tryLoadKnowledge('technology', techKey);
      if (data) result.technology.push(data);
    }
  }

  return result;
}

/**
 * Serialize a knowledge object to a concise Markdown representation for LLM prompts.
 * @param {string} sectionTitle - Markdown heading for this block
 * @param {object} obj - Knowledge file content
 * @returns {string}
 */
function serializeToMarkdown(sectionTitle, obj) {
  const lines = [`## ${sectionTitle}`, ''];

  // Industry file
  if (obj.industry && obj.processes) {
    lines.push(`**Industry:** ${obj.industry}`);
    lines.push(`**Description:** ${obj.description}`);
    lines.push('');
    lines.push('**Key KPIs (baseline → target):**');
    for (const kpi of (obj.kpis || [])) {
      lines.push(`- ${kpi.name}: ${kpi.baseline} → ${kpi.target} ${kpi.unit}`);
    }
    lines.push('');
    lines.push('**Top Pain Points:**');
    for (const pp of (obj.pain_points || []).slice(0, 5)) {
      lines.push(`- ${pp}`);
    }
    lines.push('');
    lines.push('**Typical Systems:** ' + (obj.typical_systems || []).join('; '));
    return lines.join('\n');
  }

  // Regulation file
  if (obj.regulation && obj.requirements) {
    lines.push(`**Regulation:** ${obj.regulation}`);
    lines.push(`**Jurisdiction:** ${obj.jurisdiction}`);
    lines.push(`**Description:** ${obj.description}`);
    lines.push('');
    lines.push('**Key Requirements:**');
    for (const req of (obj.requirements || [])) {
      const flag = req.mandatory ? '🔴 MANDATORY' : '🟡 CONDITIONAL';
      lines.push(`- [${req.id}] ${req.title} (${flag}): ${req.description.slice(0, 150)}...`);
    }
    lines.push('');
    lines.push(`**Penalties:** ${obj.penalties}`);
    return lines.join('\n');
  }

  // Benchmark file
  if (obj.category && obj.data_points) {
    lines.push(`**Category:** ${obj.category}`);
    lines.push(`**Description:** ${obj.description}`);
    lines.push('');
    lines.push('**Benchmark Data:**');
    for (const dp of (obj.data_points || [])) {
      lines.push(`- **${dp.metric}**: ${dp.value} *(${dp.source}, ${dp.year})*`);
    }
    return lines.join('\n');
  }

  // Technology comparison files (DMS, ERP landscape)
  if (obj.solutions) {
    lines.push(`**Category:** ${obj.category || sectionTitle}`);
    lines.push(`**Description:** ${obj.description}`);
    lines.push('');
    for (const sol of (obj.solutions || [])) {
      lines.push(`### ${sol.name} (${sol.vendor || ''})`);
      if (sol.pricing_model) lines.push(`**Pricing:** ${sol.pricing_model}`);
      if (sol.annual_license_cost) lines.push(`**Annual Cost:** ${sol.annual_license_cost}`);
      if (sol.pros) lines.push('**Pros:** ' + sol.pros.slice(0, 3).join('; '));
      if (sol.cons) lines.push('**Cons:** ' + sol.cons.slice(0, 3).join('; '));
      lines.push('');
    }
    return lines.join('\n');
  }

  // Integration patterns
  if (obj.patterns) {
    lines.push(`**Category:** ${obj.category || sectionTitle}`);
    lines.push(`**Description:** ${obj.description}`);
    lines.push('');
    for (const pat of (obj.patterns || [])) {
      lines.push(`### ${pat.name}`);
      lines.push(pat.description);
      lines.push(`**Recommended for:** ${pat.recommended_for}`);
      if (pat.pros) lines.push('**Pros:** ' + pat.pros.slice(0, 3).join('; '));
      if (pat.cons) lines.push('**Cons:** ' + pat.cons.slice(0, 2).join('; '));
      lines.push('');
    }
    return lines.join('\n');
  }

  // Anti-patterns (array at root)
  if (Array.isArray(obj)) {
    lines.push('**Anti-Patterns:**');
    for (const ap of obj) {
      lines.push(`### ${ap.name}`);
      if (ap.symptoms) lines.push('**Symptoms:** ' + ap.symptoms.slice(0, 2).join('; '));
      if (ap.correction) lines.push(`**Correction:** ${ap.correction.slice(0, 200)}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  // Generic fallback: JSON dump
  lines.push('```json');
  lines.push(JSON.stringify(obj, null, 2));
  lines.push('```');
  return lines.join('\n');
}

/**
 * Format a knowledge set as a Markdown string for LLM prompt injection.
 * Serializes each section and truncates the combined output to maxTokens characters.
 * @param {object} knowledgeSet - result of getRelevantKnowledge
 * @param {number} [maxTokens=4000] - approximate character limit for total output
 * @returns {string}
 */
export function formatKnowledgeForPrompt(knowledgeSet, maxTokens = 4000) {
  const sections = [];

  // Build all markdown sections
  for (const [category, items] of Object.entries(knowledgeSet)) {
    if (!Array.isArray(items) || items.length === 0) continue;
    sections.push(`# Knowledge: ${category.charAt(0).toUpperCase() + category.slice(1)}`);
    sections.push('');
    for (const item of items) {
      const title = item.industry || item.regulation || item.category || category;
      sections.push(serializeToMarkdown(title, item));
      sections.push('');
    }
  }

  if (sections.length === 0) {
    return '*(No relevant knowledge found for this project context)*';
  }

  let combined = sections.join('\n');

  // Truncate to maxTokens characters, breaking at a newline boundary
  if (combined.length > maxTokens) {
    combined = combined.slice(0, maxTokens);
    // Trim to last complete line to avoid mid-sentence truncation
    const lastNewline = combined.lastIndexOf('\n');
    if (lastNewline > maxTokens * 0.8) {
      combined = combined.slice(0, lastNewline);
    }
    combined += '\n\n*(Knowledge truncated to fit context window)*';
  }

  return combined;
}
