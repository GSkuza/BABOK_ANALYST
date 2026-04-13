/**
 * Temporary project directory helper for tests.
 * Creates isolated project directories and cleans them up after each test.
 */

import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Create a temporary directory with an optional project sub-directory.
 *
 * @param {string} [projectId] - If provided, creates <tmpDir>/<projectId>/ as the project dir
 * @returns {{ base: string, projectDir: string, cleanup: () => void }}
 */
export function createTempProject(projectId = 'BABOK-19700101-TEST') {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-test-'));
  const projectDir = path.join(base, projectId);
  fs.mkdirSync(projectDir, { recursive: true });

  function cleanup() {
    try {
      fs.rmSync(base, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors in tests
    }
  }

  return { base, projectDir, cleanup };
}

/**
 * Copy a fixture file into a temp project directory, renaming it to match the
 * STAGE_NN_<name>.md convention expected by the scorer.
 *
 * @param {string} fixturePath - Absolute path to the fixture file
 * @param {string} projectDir  - Target project directory
 * @param {number} stageNumber - Stage number (1-8)
 * @param {string} [stageName] - Optional suffix for the file name
 */
export function copyFixtureToProject(fixturePath, projectDir, stageNumber, stageName = 'Deliverable') {
  const nn = String(stageNumber).padStart(2, '0');
  const dest = path.join(projectDir, `STAGE_${nn}_${stageName}.md`);
  fs.copyFileSync(fixturePath, dest);
  return dest;
}

/**
 * Write raw markdown content to a stage deliverable file in the project dir.
 *
 * @param {string} projectDir
 * @param {number} stageNumber
 * @param {string} content
 * @param {string} [stageName]
 */
export function writeStageFile(projectDir, stageNumber, content, stageName = 'Deliverable') {
  const nn = String(stageNumber).padStart(2, '0');
  const dest = path.join(projectDir, `STAGE_${nn}_${stageName}.md`);
  fs.writeFileSync(dest, content, 'utf-8');
  return dest;
}
