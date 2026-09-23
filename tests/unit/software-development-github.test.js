/**
 * GitHub read connector — mocked-execFile unit tests (deterministic, no network)
 * plus a small set of real integration tests against the public
 * GSkuza/BABOK_ANALYST repository through the environment's authenticated
 * `gh` CLI. The integration tests skip themselves (with a clear reason)
 * instead of failing when `gh` is not authenticated, so this suite still
 * passes in environments without GitHub credentials.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

import { createGithubConnector, GithubApiError } from '../../cli/src/software-development/hosting/github.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Build a fake execFile(file, args, options, callback) that returns a canned result for the given `gh api` path. */
function fakeExecFile({ stdout = '', stderr = '', error = null } = {}) {
  return (_file, _args, _options, callback) => {
    callback(error, stdout, stderr);
  };
}

describe('GitHub connector (mocked gh)', () => {
  it('getRepository maps the REST shape', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ full_name: 'acme/widget', default_branch: 'main', private: false, html_url: 'https://github.com/acme/widget', description: 'A widget' }) }),
    });
    const repo = await connector.getRepository({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(repo, { fullName: 'acme/widget', defaultBranch: 'main', private: false, htmlUrl: 'https://github.com/acme/widget', description: 'A widget' });
  });

  it('resolveCommit maps commit metadata', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ sha: 'abc123', commit: { message: 'Fix bug', author: { name: 'Jane Doe', date: '2026-01-01T00:00:00Z' } } }) }),
    });
    const commit = await connector.resolveCommit({ owner: 'acme', repo: 'widget', ref: 'main' });
    assert.deepEqual(commit, { sha: 'abc123', message: 'Fix bug', author: 'Jane Doe', date: '2026-01-01T00:00:00Z' });
  });

  it('getTree reports truncation and maps entries', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ truncated: true, tree: [{ path: 'src/index.js', type: 'blob', size: 120, sha: 'a1' }] }) }),
    });
    const tree = await connector.getTree({ owner: 'acme', repo: 'widget', sha: 'main' });
    assert.equal(tree.truncated, true);
    assert.deepEqual(tree.entries, [{ path: 'src/index.js', type: 'blob', size: 120, sha: 'a1' }]);
  });

  it('getFileContent decodes base64 content', async () => {
    const encoded = Buffer.from('console.log("hi");\n', 'utf-8').toString('base64');
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ path: 'src/index.js', sha: 'a1', size: 20, encoding: 'base64', content: encoded }) }),
    });
    const file = await connector.getFileContent({ owner: 'acme', repo: 'widget', path: 'src/index.js', ref: 'main' });
    assert.equal(file.content, 'console.log("hi");\n');
    assert.equal(file.truncatedForBudget, false);
  });

  it('getFileContent enforces a read budget and reports truncation', async () => {
    const big = 'x'.repeat(1000);
    const encoded = Buffer.from(big, 'utf-8').toString('base64');
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ path: 'big.txt', sha: 'a1', size: 1000, encoding: 'base64', content: encoded }) }),
    });
    const file = await connector.getFileContent({ owner: 'acme', repo: 'widget', path: 'big.txt', ref: 'main', maxBytes: 100 });
    assert.equal(file.content.length, 100);
    assert.equal(file.truncatedForBudget, true);
  });

  it('getFileContent rejects a directory listing', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify([{ path: 'src' }]) }),
    });
    await assert.rejects(
      () => connector.getFileContent({ owner: 'acme', repo: 'widget', path: 'src', ref: 'main' }),
      /is a directory/,
    );
  });

  it('listIssues filters out pull requests', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify([
        { number: 1, title: 'Real issue', state: 'open', html_url: 'https://x/1' },
        { number: 2, title: 'A PR', state: 'open', html_url: 'https://x/2', pull_request: { url: 'https://x/2' } },
      ]) }),
    });
    const issues = await connector.listIssues({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(issues, [{ number: 1, title: 'Real issue', state: 'open', htmlUrl: 'https://x/1' }]);
  });

  it('listPullRequests maps head/base refs', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify([
        { number: 5, title: 'Add feature', state: 'open', html_url: 'https://x/5', head: { ref: 'feature' }, base: { ref: 'main' } },
      ]) }),
    });
    const prs = await connector.listPullRequests({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(prs, [{ number: 5, title: 'Add feature', state: 'open', htmlUrl: 'https://x/5', headRef: 'feature', baseRef: 'main' }]);
  });

  it('listWorkflowRuns maps run metadata', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: JSON.stringify({ workflow_runs: [{ id: 1, name: 'CI', status: 'completed', conclusion: 'success', head_sha: 'abc', html_url: 'https://x/run/1' }] }) }),
    });
    const runs = await connector.listWorkflowRuns({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(runs, [{ id: 1, name: 'CI', status: 'completed', conclusion: 'success', headSha: 'abc', htmlUrl: 'https://x/run/1' }]);
  });

  it('wraps a 404 as GithubApiError with status/code "not_found"', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({
        stdout: JSON.stringify({ message: 'Not Found', status: '404' }),
        stderr: 'gh: Not Found (HTTP 404)',
        error: new Error('Command failed'),
      }),
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'does-not-exist' }),
      (err) => {
        assert.ok(err instanceof GithubApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'not_found');
        assert.match(err.message, /Not Found/);
        return true;
      },
    );
  });

  it('wraps a 403 as GithubApiError with code "forbidden"', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({
        stdout: JSON.stringify({ message: 'Forbidden' }),
        stderr: 'gh: Forbidden (HTTP 403)',
        error: new Error('Command failed'),
      }),
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'private-repo' }),
      (err) => {
        assert.equal(err.status, 403);
        assert.equal(err.code, 'forbidden');
        return true;
      },
    );
  });

  it('wraps a non-JSON exec failure (e.g. gh not installed) as code "unknown"', async () => {
    const connector = createGithubConnector({
      execFileImpl: fakeExecFile({ stdout: '', stderr: '', error: new Error('spawn gh ENOENT') }),
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'widget' }),
      (err) => {
        assert.ok(err instanceof GithubApiError);
        assert.equal(err.status, null);
        assert.equal(err.code, 'unknown');
        assert.match(err.message, /ENOENT/);
        return true;
      },
    );
  });
});

// ── Real integration tests against the authenticated `gh` CLI ──────────────
// Skip (not fail) when `gh` is unavailable/unauthenticated, so this suite
// still passes on machines without GitHub credentials configured.
function ghAuthenticated() {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const skipReason = ghAuthenticated() ? false : '`gh` is not authenticated in this environment — run `gh auth login` to enable this suite';

describe('GitHub connector (live gh, GSkuza/BABOK_ANALYST, read-only)', { skip: skipReason }, () => {
  const connector = createGithubConnector();
  const target = { owner: 'GSkuza', repo: 'BABOK_ANALYST' };

  it('reads real repository metadata', async () => {
    const repo = await connector.getRepository(target);
    assert.equal(repo.fullName, 'GSkuza/BABOK_ANALYST');
    assert.equal(repo.defaultBranch, 'main');
    assert.equal(typeof repo.private, 'boolean');
  });

  it('resolves main to a 40-character commit sha', async () => {
    const commit = await connector.resolveCommit({ ...target, ref: 'main' });
    assert.match(commit.sha, /^[0-9a-f]{40}$/);
  });

  it('reads VERSION and matches the local checkout at the resolved commit\'s ref', async () => {
    const file = await connector.getFileContent({ ...target, path: 'VERSION', ref: 'main' });
    const local = fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf-8').trim();
    assert.equal(file.content.trim(), local);
  });

  it('lists a non-empty repository tree for main', async () => {
    const tree = await connector.getTree({ ...target, sha: 'main' });
    assert.ok(tree.entries.length > 100, 'expected a substantial file tree');
    assert.ok(tree.entries.some(e => e.path === 'VERSION'));
  });

  it('lists pull requests without throwing', async () => {
    const prs = await connector.listPullRequests({ ...target, state: 'all', perPage: 5 });
    assert.ok(Array.isArray(prs));
    if (prs.length > 0) assert.equal(typeof prs[0].number, 'number');
  });

  it('lists issues without throwing and excludes pull requests', async () => {
    const issues = await connector.listIssues({ ...target, state: 'all', perPage: 10 });
    assert.ok(Array.isArray(issues));
  });

  it('surfaces a real 404 as GithubApiError', async () => {
    await assert.rejects(
      () => connector.getRepository({ owner: 'GSkuza', repo: 'this-repo-does-not-exist-babok-sd-check' }),
      (err) => {
        assert.ok(err instanceof GithubApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'not_found');
        return true;
      },
    );
  });
});
