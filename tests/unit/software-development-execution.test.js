/**
 * Execution authorisation + code executor: real command execution against a
 * genuine local git repository created for this test (never the real
 * BABOK_ANALYST checkout, never a remote) — proving the authorisation gate
 * and the whitelist actually stop an unauthorised or non-whitelisted command,
 * and that an authorised, whitelisted one really runs and its real exit code
 * is reported.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

import {
  setExecutionAuthorization,
  readExecutionAuthorization,
  assertAuthorized,
} from '../../cli/src/software-development/runtime/execution-authorization.js';
import { runCommand } from '../../cli/src/software-development/runtime/code-executor.js';

let tmpBase;
let sandboxRepoDir;
let originalCwd;
const INITIATIVE = 'SD-20260101-EXEC';

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-exec-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase);

  // A genuine, disposable local git repository standing in for "the analysed
  // repository" — created fresh for this test, never touched again outside it.
  sandboxRepoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-exec-sandbox-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: sandboxRepoDir });
  execFileSync('git', ['config', 'user.email', 'sandbox@example.com'], { cwd: sandboxRepoDir });
  execFileSync('git', ['config', 'user.name', 'Sandbox'], { cwd: sandboxRepoDir });
  fs.writeFileSync(path.join(sandboxRepoDir, 'add.test.js'), `
    const assert = require('node:assert');
    assert.equal(1 + 1, 2);
    console.log('sandbox test passed');
  `);
  execFileSync('git', ['add', '.'], { cwd: sandboxRepoDir });
  execFileSync('git', ['commit', '-q', '-m', 'initial commit'], { cwd: sandboxRepoDir });
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
  fs.rmSync(sandboxRepoDir, { recursive: true, force: true });
});

describe('execution-authorization', () => {
  it('is unauthorised by default', () => {
    assert.equal(readExecutionAuthorization(INITIATIVE, 'run_tests'), null);
    assert.throws(() => assertAuthorized(INITIATIVE, 'run_tests'), /not authorised/);
  });

  it('records who granted it, when, and its constraints', () => {
    setExecutionAuthorization(INITIATIVE, 'run_tests', {
      granted: true,
      grantedBy: 'Test Human',
      constraints: { allowedCommands: ['node'], allowedDirectories: [sandboxRepoDir] },
    });
    const record = readExecutionAuthorization(INITIATIVE, 'run_tests');
    assert.equal(record.granted, true);
    assert.equal(record.grantedBy, 'Test Human');
    assert.deepEqual(record.constraints.allowedCommands, ['node']);
  });

  it('rejects an unknown scope', () => {
    assert.throws(() => setExecutionAuthorization(INITIATIVE, 'deploy_prod', { granted: true, grantedBy: 'x' }), /unknown scope/);
  });

  it('requires grantedBy', () => {
    assert.throws(() => setExecutionAuthorization(INITIATIVE, 'run_tests', { granted: true, grantedBy: '' }), /"grantedBy".*required/);
  });

  it('an explicit revocation (granted: false) is respected by assertAuthorized', () => {
    const initiative = 'SD-20260101-REVOKE';
    setExecutionAuthorization(initiative, 'run_tests', { granted: true, grantedBy: 'Human' });
    assert.doesNotThrow(() => assertAuthorized(initiative, 'run_tests'));
    setExecutionAuthorization(initiative, 'run_tests', { granted: false, grantedBy: 'Human' });
    assert.throws(() => assertAuthorized(initiative, 'run_tests'), /not authorised/);
  });
});

describe('code-executor (runCommand) — real git repo, real process execution', () => {
  it('runs an authorised, whitelisted command and returns its real exit code and stdout', async () => {
    const result = await runCommand(INITIATIVE, {
      cwd: sandboxRepoDir,
      command: 'node',
      args: ['add.test.js'],
    });
    assert.equal(result.exitCode, 0);
    assert.match(result.stdout, /sandbox test passed/);
    assert.equal(typeof result.durationMs, 'number');
  });

  it('reports a real non-zero exit code for a real failure, not a silent success', async () => {
    fs.writeFileSync(path.join(sandboxRepoDir, 'fail.js'), 'process.exit(7);');
    const result = await runCommand(INITIATIVE, { cwd: sandboxRepoDir, command: 'node', args: ['fail.js'] });
    assert.equal(result.exitCode, 7);
  });

  it('refuses a command outside the authorisation\'s allowedCommands whitelist', async () => {
    await assert.rejects(
      () => runCommand(INITIATIVE, { cwd: sandboxRepoDir, command: 'git', args: ['status'] }),
      /"git" is not in the run_tests authorisation's allowedCommands/,
    );
  });

  it('refuses to run at all for an initiative with no execution authorisation', async () => {
    await assert.rejects(
      () => runCommand('SD-NEVER-AUTHORISED', { cwd: sandboxRepoDir, command: 'node', args: ['add.test.js'] }),
      /not authorised/,
    );
  });

  it('refuses a cwd outside the authorisation\'s allowedDirectories', async () => {
    const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-exec-outside-'));
    try {
      await assert.rejects(
        () => runCommand(INITIATIVE, { cwd: outsideDir, command: 'node', args: ['-e', '1'] }),
        /outside the run_tests authorisation's allowedDirectories/,
      );
    } finally {
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  it('reports a spawn failure (command not found) as a rejected promise, not a fabricated result', async () => {
    setExecutionAuthorization(INITIATIVE, 'run_tests', {
      granted: true,
      grantedBy: 'Test Human',
      constraints: { allowedCommands: ['this-binary-does-not-exist-babok-sd'], allowedDirectories: [sandboxRepoDir] },
    });
    await assert.rejects(
      () => runCommand(INITIATIVE, { cwd: sandboxRepoDir, command: 'this-binary-does-not-exist-babok-sd', args: [] }),
      /failed to spawn/,
    );
    // restore the authorisation used by the rest of the suite
    setExecutionAuthorization(INITIATIVE, 'run_tests', {
      granted: true,
      grantedBy: 'Test Human',
      constraints: { allowedCommands: ['node'], allowedDirectories: [sandboxRepoDir] },
    });
  });
});
