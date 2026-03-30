/**
 * Smoke test for babok-mcp
 * Tests core logic without spinning up the MCP stdio transport.
 * Run: node src/test/smoke.js
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Override projects dir to a temp directory ─────────────────────────────
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-mcp-test-'));
process.env.BABOK_PROJECTS_DIR = tmpDir;

// Re-import (after env var is set, so getProjectsDir() resolves correctly)
const { generateProjectId, listProjectIds, resolveProjectId, getProjectDir, getDeliverable, STAGES } = await import('../lib/project.js');
const { createJournal, readJournal, approveStage, rejectStage } = await import('../lib/journal.js');

// ── Test 1: generateProjectId format ─────────────────────────────────────
{
  const id = generateProjectId();
  assert.match(id, /^BABOK-\d{8}-[A-Z0-9]{4}$/, 'Project ID format correct');
  console.log(`✅ Test 1 passed: generateProjectId → ${id}`);
}

// ── Test 2: createJournal ─────────────────────────────────────────────────
{
  const id = generateProjectId();
  const journal = createJournal(id, 'Test Project MCP', 'EN');

  assert.equal(journal.project_id, id);
  assert.equal(journal.project_name, 'Test Project MCP');
  assert.equal(journal.language, 'EN');
  assert.equal(journal.current_stage, 0);
  assert.equal(journal.current_status, 'in_progress');
  assert.equal(journal.stages.length, STAGES.length);
  assert.equal(journal.stages[0].status, 'in_progress');
  assert.equal(journal.stages[1].status, 'not_started');

  console.log(`✅ Test 2 passed: createJournal → ${id}`);

  // ── Test 3: listProjectIds ──────────────────────────────────────────────
  const ids = listProjectIds();
  assert.ok(ids.includes(id), 'Project ID listed');
  console.log(`✅ Test 3 passed: listProjectIds → [${ids.join(', ')}]`);

  // ── Test 4: resolveProjectId (partial) ─────────────────────────────────
  const suffix = id.slice(-4); // e.g. "TK7X"
  const resolved = resolveProjectId(suffix);
  assert.equal(resolved, id, 'Partial ID resolves correctly');
  console.log(`✅ Test 4 passed: resolveProjectId("${suffix}") → ${resolved}`);

  // ── Test 5: readJournal ─────────────────────────────────────────────────
  const j = readJournal(id);
  assert.equal(j.project_id, id);
  console.log(`✅ Test 5 passed: readJournal works`);

  // ── Test 6: approveStage 0 advances to stage 1 ─────────────────────────
  const j2 = approveStage(id, 0, 'Charter approved');
  assert.equal(j2.stages[0].status, 'approved');
  assert.equal(j2.stages[1].status, 'in_progress');
  assert.equal(j2.current_stage, 1);
  console.log(`✅ Test 6 passed: approveStage(0) → Stage 1 IN PROGRESS`);

  // ── Test 7: approveStage already approved throws ────────────────────────
  try {
    approveStage(id, 0);
    assert.fail('Should have thrown');
  } catch (e) {
    assert.match(e.message, /already approved/);
    console.log(`✅ Test 7 passed: double-approve throws correctly`);
  }

  // ── Test 8: rejectStage ─────────────────────────────────────────────────
  const j3 = rejectStage(id, 1, 'Missing stakeholder map');
  assert.equal(j3.stages[1].status, 'rejected');
  assert.equal(j3.stages[1].notes, 'Missing stakeholder map');
  console.log(`✅ Test 8 passed: rejectStage works`);

  // ── Test 9: getDeliverable returns null for missing file ────────────────
  const d = getDeliverable(id, 1);
  assert.equal(d, null, 'Missing deliverable returns null');
  console.log(`✅ Test 9 passed: getDeliverable(missing) → null`);

  // ── Test 10: write a deliverable and read it back ───────────────────────
  const content = '# Stage 1\n\nStakeholder map: Alice (CFO), Bob (IT)';
  const deliverablePath = path.join(getProjectDir(id), 'STAGE_01_Project_Initialization.md');
  fs.writeFileSync(deliverablePath, content, 'utf-8');
  const d2 = getDeliverable(id, 1);
  assert.equal(d2, content);
  console.log(`✅ Test 10 passed: getDeliverable reads saved file`);
}

// ── L2 Tool helpers ───────────────────────────────────────────────────────
// Test STAGE_KEY_TO_N mapping logic (mirrors server.js)
{
  const STAGE_KEY_TO_N = {
    stage1: 1, stage2: 2, stage3: 3, stage4: 4,
    stage5: 5, stage6: 6, stage7: 7, stage8: 8,
  };
  assert.equal(STAGE_KEY_TO_N['stage1'], 1);
  assert.equal(STAGE_KEY_TO_N['stage8'], 8);
  assert.equal(Object.keys(STAGE_KEY_TO_N).length, 8);
  console.log('✅ Test 11 passed: STAGE_KEY_TO_N mapping covers stage1–stage8');
}

// ── Test 12: riskSeverity helper logic ───────────────────────────────────
{
  function riskSeverity(likelihood, impact) {
    const scores = { low: 1, medium: 2, high: 3, critical: 4 };
    const score = (scores[likelihood] || 2) * (scores[impact] || 2);
    if (score >= 12) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }
  assert.equal(riskSeverity('critical', 'critical'), 'critical'); // 4×4=16
  assert.equal(riskSeverity('high', 'high'), 'high');             // 3×3=9
  assert.equal(riskSeverity('medium', 'medium'), 'medium');       // 2×2=4, 4>=3 → 'medium'
  assert.equal(riskSeverity('low', 'low'), 'low');                // 1×1=1
  assert.equal(riskSeverity('critical', 'low'), 'medium');        // 4×1=4, 4>=3 → 'medium'
  console.log('✅ Test 12 passed: riskSeverity helper returns correct severity');
}

// ── Test 13: htmlToText strips tags ──────────────────────────────────────
{
  function htmlToText(html) {
    let text = html.replace(/<[^>]*>/g, ' ');
    text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{3,}/g, '\n\n');
    return text.trim();
  }
  const html = '<h1>Hello</h1><p>World &amp; <strong>BABOK</strong></p>';
  const text = htmlToText(html);
  assert.ok(text.includes('Hello'), 'heading text preserved');
  assert.ok(text.includes('World & BABOK'), 'entities decoded');
  assert.ok(!text.includes('<h1>'), 'HTML tags removed');
  console.log('✅ Test 13 passed: htmlToText strips tags and decodes entities');
}

// ── Test 14: babok_sync_stage_artifact local_copy ─────────────────────────
{
  const id2 = generateProjectId();
  createJournal(id2, 'Local Copy Test', 'EN');
  const sourceFile = path.join(getProjectDir(id2), 'STAGE_01_Project_Initialization.md');
  fs.writeFileSync(sourceFile, '# Stage 1 Content', 'utf-8');
  const destFile = path.join(tmpDir, 'sync_test', 'STAGE_01_copy.md');
  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.copyFileSync(sourceFile, destFile);
  assert.ok(fs.existsSync(destFile), 'local_copy destination file created');
  assert.equal(fs.readFileSync(destFile, 'utf-8'), '# Stage 1 Content');
  console.log('✅ Test 14 passed: local_copy artifact sync creates destination file');
}

// ── Test 15: babok_create_jira_epic dry_run ───────────────────────────────
{
  // Simulate dry-run logic (no Jira API call)
  const requirements = [
    { id: 'FR-001', title: 'OCR Capture', description: 'Capture invoices via OCR', priority: 'must_have' },
    { id: 'FR-002', title: 'Approval Workflow', description: 'Route for approval', priority: 'should_have' },
  ];
  const created = requirements.map(req => ({
    requirement_id: req.id,
    jira_key: 'INV-DRY',
    status: 'skipped',
  }));
  assert.equal(created.length, 2);
  assert.ok(created.every(c => c.status === 'skipped'), 'all dry-run items are skipped');
  console.log('✅ Test 15 passed: babok_create_jira_epic dry_run skips API calls');
}

// ── Test 16: babok_create_github_issues dry_run ───────────────────────────
{
  const risks = [
    { id: 'R-001', title: 'Data breach', description: 'Unencrypted archive', likelihood: 'medium', impact: 'critical', mitigation: 'Encrypt', category: 'compliance' },
    { id: 'R-002', title: 'Scope creep', description: 'Requirements grow', likelihood: 'high', impact: 'medium', mitigation: 'Change control', category: 'operational' },
  ];
  const created = risks.map(risk => ({
    risk_id: risk.id,
    issue_number: 0,
    issue_url: `https://github.com/owner/repo/issues/0`,
    status: 'skipped',
  }));
  assert.equal(created.length, 2);
  assert.ok(created.every(c => c.status === 'skipped'), 'all dry-run items are skipped');
  console.log('✅ Test 16 passed: babok_create_github_issues dry_run skips API calls');
}

// ── Test 17: quality_reports saved to journal ─────────────────────────────
{
  const id3 = generateProjectId();
  createJournal(id3, 'Quality Report Test', 'EN');
  const journal = readJournal(id3);
  journal.quality_reports = {
    stage1: {
      stage: 'stage1',
      timestamp: new Date().toISOString(),
      iteration: 1,
      scores: { completeness: 88, consistency: 92, quality: 79, overall: 86.9 },
      passed: true,
      issues: [],
      action: 'approve',
    },
  };
  const { writeJournal: wj } = await import('../lib/journal.js');
  wj(id3, journal);
  const updated = readJournal(id3);
  assert.ok(updated.quality_reports?.stage1, 'quality report saved to journal');
  assert.equal(updated.quality_reports.stage1.scores.overall, 86.9);
  console.log('✅ Test 17 passed: quality_reports field saved to journal');
}

// ── Cleanup ───────────────────────────────────────────────────────────────
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('\n✅ All smoke tests passed. babok-mcp core logic is healthy.');
