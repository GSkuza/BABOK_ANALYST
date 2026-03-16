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

// ── Cleanup ───────────────────────────────────────────────────────────────
fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('\n✅ All smoke tests passed. babok-mcp core logic is healthy.');
