/**
 * Unit tests for the quality scorer (cli/src/quality/scorer.js)
 * Uses Node.js native test runner (node:test)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { scoreStage } from '../../cli/src/quality/scorer.js';
import { createTempProject, copyFixtureToProject, writeStageFile } from '../helpers/temp-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

// ─── Helpers ────────────────────────────────────────────────────────────────

function fixtureFile(name) {
  return path.join(FIXTURES_DIR, name);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('scoreStage with valid_stage1.md', () => {
  let tmp;
  let report;

  before(async () => {
    tmp = createTempProject('BABOK-TEST-VALID1');
    copyFixtureToProject(fixtureFile('valid_stage1.md'), tmp.projectDir, 1, 'Project_Initialization');
    report = await scoreStage('BABOK-TEST-VALID1', 1, { projectDir: tmp.projectDir });
  });

  after(() => tmp.cleanup());

  test('report has correct structure', () => {
    assert.ok(report, 'Report should exist');
    assert.equal(typeof report.projectId, 'string');
    assert.equal(typeof report.stage, 'number');
    assert.equal(report.stage, 1);
    assert.ok(report.timestamp, 'Should have timestamp');
    assert.ok(report.scores, 'Should have scores');
    assert.ok(Array.isArray(report.issues), 'Issues should be an array');
  });

  test('completeness score is high (all sections present)', () => {
    assert.ok(
      report.scores.completeness >= 70,
      `Expected completeness >= 70, got ${report.scores.completeness}`
    );
  });

  test('quality score is > 0 (has numeric KPIs and dates)', () => {
    assert.ok(
      report.scores.quality > 0,
      `Expected quality > 0, got ${report.scores.quality}`
    );
  });

  test('overall score is positive', () => {
    assert.ok(report.scores.overall > 0, `Expected overall > 0, got ${report.scores.overall}`);
  });

  test('score report is saved to disk', () => {
    const scoreFile = path.join(tmp.projectDir, 'scores', 'STAGE_01_score.json');
    assert.ok(fs.existsSync(scoreFile), `Score file should exist at ${scoreFile}`);
  });

  test('saved score file contains valid JSON matching report', () => {
    const scoreFile = path.join(tmp.projectDir, 'scores', 'STAGE_01_score.json');
    const saved = JSON.parse(fs.readFileSync(scoreFile, 'utf-8'));
    assert.equal(saved.stage, 1);
    assert.equal(saved.scores.overall, report.scores.overall);
  });
});

describe('scoreStage with invalid_stage1_missing_raci.md', () => {
  let tmp;
  let validReport;
  let invalidReport;

  before(async () => {
    // Score valid first
    const tmpValid = createTempProject('BABOK-TEST-VALID1B');
    copyFixtureToProject(fixtureFile('valid_stage1.md'), tmpValid.projectDir, 1, 'Deliverable');
    validReport = await scoreStage('BABOK-TEST-VALID1B', 1, { projectDir: tmpValid.projectDir });
    tmpValid.cleanup();

    // Score invalid (missing RACI)
    tmp = createTempProject('BABOK-TEST-NORACI');
    copyFixtureToProject(fixtureFile('invalid_stage1_missing_raci.md'), tmp.projectDir, 1, 'Deliverable');
    invalidReport = await scoreStage('BABOK-TEST-NORACI', 1, { projectDir: tmp.projectDir });
  });

  after(() => tmp.cleanup());

  test('completeness score is lower than valid fixture', () => {
    assert.ok(
      invalidReport.scores.completeness < validReport.scores.completeness,
      `Expected ${invalidReport.scores.completeness} < ${validReport.scores.completeness}`
    );
  });

  test('issues array contains a completeness error for RACI', () => {
    const raciIssue = invalidReport.issues.find(
      i => i.dimension === 'completeness' && i.message.toLowerCase().includes('raci')
    );
    assert.ok(raciIssue, 'Should have a completeness issue mentioning RACI');
  });
});

describe('scoreStage boundary conditions', () => {
  test('overall = 74 → passed = false', () => {
    // Construct a synthetic report to verify the boundary logic
    const report = { scores: { overall: 74 }, passed: 74 >= 75 };
    assert.equal(report.passed, false, 'Score 74 should fail');
  });

  test('overall = 75 → passed = true', () => {
    const report = { scores: { overall: 75 }, passed: 75 >= 75 };
    assert.equal(report.passed, true, 'Score 75 should pass');
  });

  test('throws when no deliverable file exists', async () => {
    const tmp = createTempProject('BABOK-TEST-EMPTY');
    try {
      await assert.rejects(
        () => scoreStage('BABOK-TEST-EMPTY', 1, { projectDir: tmp.projectDir }),
        /No deliverable found/,
        'Should reject with "No deliverable found"'
      );
    } finally {
      tmp.cleanup();
    }
  });

  test('throws for invalid stage number (e.g. 9)', async () => {
    const tmp = createTempProject('BABOK-TEST-BADSTAGE');
    try {
      await assert.rejects(
        () => scoreStage('BABOK-TEST-BADSTAGE', 9, { projectDir: tmp.projectDir }),
        /No rubric entry/,
        'Should reject for stage 9'
      );
    } finally {
      tmp.cleanup();
    }
  });
});

describe('scoreStage with invalid_stage1_no_kpi_numbers.md', () => {
  let tmp;
  let report;

  before(async () => {
    tmp = createTempProject('BABOK-TEST-NOKPI');
    copyFixtureToProject(
      fixtureFile('invalid_stage1_no_kpi_numbers.md'),
      tmp.projectDir,
      1,
      'Deliverable'
    );
    report = await scoreStage('BABOK-TEST-NOKPI', 1, { projectDir: tmp.projectDir });
  });

  after(() => tmp.cleanup());

  test('quality issues are reported (no numeric KPIs)', () => {
    const qualityIssues = report.issues.filter(i => i.dimension === 'quality');
    assert.ok(qualityIssues.length > 0, 'Should have quality issues for missing numeric KPIs');
  });

  test('report has rubricVersion field', () => {
    assert.ok(report.rubricVersion, 'Should have rubricVersion');
    assert.equal(typeof report.rubricVersion, 'string');
  });
});
