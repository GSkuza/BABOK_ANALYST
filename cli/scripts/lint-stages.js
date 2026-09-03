#!/usr/bin/env node
/**
 * BABOK Stage File Linter
 * Validates the stage prompt files of every pipeline profile (profiles/<id>/profile.json).
 *
 * Usage:   node cli/scripts/lint-stages.js
 * Exit 0:  all checks pass
 * Exit 1:  one or more checks failed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────
//  Configuration
// ──────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..', '..');
const PROFILES_DIR = path.join(ROOT, 'profiles');

/** @returns {Array<{ id: string, stagesDir: string, stages: Array<{ stage: number, prompt_file: string }> }>} */
function loadProfiles() {
  return fs.readdirSync(PROFILES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(PROFILES_DIR, e.name, 'profile.json')))
    .map(e => {
      const p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, e.name, 'profile.json'), 'utf-8'));
      return { id: p.id, stagesDir: path.join(ROOT, p.paths.stages_dir), stages: p.stages };
    });
}

/** Sections every stage file must contain (case-insensitive heading match) */
const REQUIRED_SECTIONS = [
  /^#{1,3}\s+objectives?/i,
  /^#{1,3}\s+(process|steps?|procedure)/i,
];

/** Patterns that indicate unfilled template placeholders */
const PLACEHOLDER_PATTERNS = [
  /\[YOUR[_\s]VALUE\]/i,
  /\[PLACEHOLDER\]/i,
  /\[INSERT\s+HERE\]/i,
  /\[TBD\]/i,
  /\[FILL\s+IN\]/i,
];

/** Rough token estimate: 1 token ≈ 4 characters */
const MAX_TOKENS_ESTIMATE = 8192;
const CHARS_PER_TOKEN = 4;

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m⚠\x1b[0m';

function ok(msg) { console.log(`  ${PASS} ${msg}`); }
function fail(msg) { console.error(`  ${FAIL} ${msg}`); }
function warn(msg) { console.warn(`  ${WARN} ${msg}`); }

// ──────────────────────────────────────────────
//  Lint checks
// ──────────────────────────────────────────────

function lintFile(filePath) {
  const errors = [];
  const warnings = [];

  // 1. File existence
  if (!fs.existsSync(filePath)) {
    return { errors: [`File missing: ${filePath}`], warnings: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 2. Starts with # STAGE heading
  const firstHeading = lines.find(l => l.startsWith('#'));
  if (!firstHeading) {
    errors.push('No Markdown heading found');
  } else if (!/^#{1,2}\s+STAGE\s+\d/i.test(firstHeading)) {
    warnings.push(`First heading does not match "# STAGE N: ..." pattern: "${firstHeading.trim()}"`);
  }

  // 3. Required sections
  for (const pattern of REQUIRED_SECTIONS) {
    const found = lines.some(l => pattern.test(l));
    if (!found) {
      errors.push(`Missing required section matching: ${pattern}`);
    }
  }

  // 4. Unfilled placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const hitLine = lines.findIndex(l => pattern.test(l));
    if (hitLine >= 0) {
      warnings.push(`Possible unfilled placeholder on line ${hitLine + 1}: "${lines[hitLine].trim()}"`);
    }
  }

  // 5. Token estimate
  const estimatedTokens = Math.round(content.length / CHARS_PER_TOKEN);
  if (estimatedTokens > MAX_TOKENS_ESTIMATE) {
    warnings.push(`Estimated token count ~${estimatedTokens} exceeds ${MAX_TOKENS_ESTIMATE} limit`);
  }

  // 6. Empty file guard
  if (content.trim().length < 100) {
    errors.push('File appears to be nearly empty (< 100 chars)');
  }

  return { errors, warnings };
}

// ──────────────────────────────────────────────
//  Main
// ──────────────────────────────────────────────

let totalErrors = 0;
let totalWarnings = 0;

console.log('\n\x1b[1mBABOK Stage File Linter\x1b[0m');

if (!fs.existsSync(PROFILES_DIR)) {
  console.error(`\x1b[31mFATAL: profiles directory not found: ${PROFILES_DIR}\x1b[0m`);
  process.exit(1);
}

for (const profile of loadProfiles()) {
  console.log(`\x1b[1mProfile "${profile.id}"\x1b[0m — ${profile.stagesDir}\n`);

  if (!fs.existsSync(profile.stagesDir)) {
    fail(`stages directory not found: ${profile.stagesDir}`);
    totalErrors++;
    continue;
  }

  for (const s of profile.stages) {
    const label = `Stage ${s.stage} (${s.prompt_file})`;
    console.log(`\x1b[1m${label}\x1b[0m`);

    const { errors, warnings } = lintFile(path.join(profile.stagesDir, s.prompt_file));

    if (errors.length === 0 && warnings.length === 0) {
      ok('All checks passed');
    } else {
      for (const e of errors) { fail(e); totalErrors++; }
      for (const w of warnings) { warn(w); totalWarnings++; }
    }
    console.log('');
  }
}

// Summary
console.log('─'.repeat(50));
if (totalErrors === 0) {
  console.log(`\x1b[32m✅ Lint passed\x1b[0m — ${totalWarnings} warning(s)`);
} else {
  console.error(`\x1b[31m❌ Lint failed\x1b[0m — ${totalErrors} error(s), ${totalWarnings} warning(s)`);
}
console.log('');

process.exit(totalErrors > 0 ? 1 : 0);
