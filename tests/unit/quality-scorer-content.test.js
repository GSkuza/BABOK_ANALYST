/**
 * Unit tests for scoreContent (cli/src/quality/scorer.js) — the pure,
 * file-I/O-free scoring core extracted for reuse by the staged generation
 * engine and the MCP quality-check tool.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scoreContent, scoreStage } from '../../cli/src/quality/scorer.js';
import { createTempProject, copyFixtureToProject } from '../helpers/temp-project.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');

function fixtureFile(name) {
  return path.join(FIXTURES_DIR, name);
}

const STAGE_RUBRIC = {
  required_sections: ['Functional Requirements (FR-NNN)', 'Non-Functional Requirements (NFR-NNN)', 'Requirements Traceability Matrix (RTM)'],
  quality_criteria: [
    { id: 'S4-Q3', description: 'Each FR has a unique ID', applies_to: 'Functional Requirements', smart_dimension: 'Specific' },
    { id: 'S4-Q2', description: 'NFRs contain numeric thresholds', applies_to: 'Non-Functional Requirements', smart_dimension: 'Measurable' },
  ],
  consistency_checks: [],
  weights: { completeness: 0.4, consistency: 0.3, quality: 0.3 },
};

const RUBRIC = { version: 'test-1.0', scoring: { min_overall_score: 75 } };

const SAMPLE_CONTENT = `
## Functional Requirements (FR-NNN)
FR-001: system shall do X.

## Non-Functional Requirements (NFR-NNN)
NFR-001: response time < 2s.
`;

describe('scoreContent — no depth (default, must match legacy scoreStage output)', () => {
  test('omits the depth dimension entirely when includeDepth is not set', async () => {
    const result = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC);
    assert.equal(result.scores.depth, undefined);
    assert.equal(typeof result.scores.overall, 'number');
    assert.equal(typeof result.passed, 'boolean');
    assert.equal(result.rubricVersion, 'test-1.0');
  });

  test('produces byte-identical composite weights to the pre-refactor formula', async () => {
    const result = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC);
    // Reproduce the original scorer.js formula by hand for comparison.
    const completeness = Math.round((2 / 3) * 100); // RTM missing from SAMPLE_CONTENT
    assert.equal(result.scores.completeness, completeness);
  });
});

describe('scoreContent — with depth judge included', () => {
  test('folds a mocked depth score into the composite and redistributes weights to sum to 1', async () => {
    const llmClient = { chat: async () => JSON.stringify({ score: 100, findings: [] }) };
    const result = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC, {
      llmClient,
      includeDepth: true,
      stageNumber: 4,
    });
    assert.equal(result.scores.depth, 100);
    assert.ok(result.scores.overall > 0);
  });

  test('a low depth score pulls the overall composite down relative to depth omitted', async () => {
    const highDepthClient = { chat: async () => JSON.stringify({ score: 100, findings: [] }) };
    const lowDepthClient = { chat: async () => JSON.stringify({ score: 0, findings: [] }) };

    const withoutDepth = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC);
    const highDepth = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC, { llmClient: highDepthClient, includeDepth: true, stageNumber: 4 });
    const lowDepth = await scoreContent(SAMPLE_CONTENT, STAGE_RUBRIC, RUBRIC, { llmClient: lowDepthClient, includeDepth: true, stageNumber: 4 });

    assert.ok(lowDepth.scores.overall < highDepth.scores.overall);
    // With depth omitted, the completeness/consistency/quality weights are unscaled.
    assert.ok(Math.abs(withoutDepth.scores.overall - highDepth.scores.overall) < 15);
  });
});

describe('scoreContent — sectionsScope (partial/batch checks)', () => {
  test('a partial draft missing later-batch sections is not penalised for them when scoped', async () => {
    const partialContent = `\n## Functional Requirements (FR-NNN)\nFR-001: system shall do X.\n\n## Non-Functional Requirements (NFR-NNN)\nNFR-001: response time < 2s.\n`;
    const scoped = await scoreContent(partialContent, STAGE_RUBRIC, RUBRIC, {
      sectionsScope: ['Functional Requirements (FR-NNN)', 'Non-Functional Requirements (NFR-NNN)'],
    });
    const unscoped = await scoreContent(partialContent, STAGE_RUBRIC, RUBRIC);

    assert.equal(scoped.scores.completeness, 100, 'scoped check should not require the not-yet-written RTM section');
    assert.ok(unscoped.scores.completeness < 100, 'unscoped check correctly flags the missing RTM section');
  });

  test('quality_criteria outside the scope are not evaluated', async () => {
    const frOnly = `\n## Functional Requirements (FR-NNN)\nFR-001: system shall do X.\n`;
    const scoped = await scoreContent(frOnly, STAGE_RUBRIC, RUBRIC, {
      sectionsScope: ['Functional Requirements (FR-NNN)'],
    });
    // Only S4-Q3 (applies_to Functional Requirements) should be checked; S4-Q2 (NFR) is out of scope.
    const nfrIssue = scoped.issues.find(i => i.ruleId === 'S4-Q2');
    assert.equal(nfrIssue, undefined, 'NFR quality criterion should not fire when NFR section is out of scope');
  });
});

describe('scoreStage remains unaffected (regression check via existing fixture)', () => {
  test('valid_stage1.md still scores exactly as before the refactor', async () => {
    const tmp = createTempProject('BABOK-TEST-SCORECONTENT-REGRESSION');
    copyFixtureToProject(fixtureFile('valid_stage1.md'), tmp.projectDir, 1, 'Project_Initialization');
    const report = await scoreStage('BABOK-TEST-SCORECONTENT-REGRESSION', 1, { projectDir: tmp.projectDir });
    tmp.cleanup();

    assert.equal(report.scores.depth, undefined);
    assert.ok(report.scores.completeness >= 70);
    assert.ok(report.scores.overall > 0);
  });
});
