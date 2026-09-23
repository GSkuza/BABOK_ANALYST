/**
 * GitLab read connector — mocked-fetch unit tests only.
 *
 * No GitLab credentials are available in this environment, so unlike
 * software-development-github.test.js there is no live integration suite
 * here. These tests validate the connector against the documented GitLab
 * REST v4 response shapes; run it once against a real GitLab project/token
 * before relying on it for a real initiative.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createGitlabConnector, GitlabApiError } from '../../cli/src/software-development/hosting/gitlab.js';

/** Build a fake fetch(url, options) resolving to a canned Response-like object. */
function fakeFetch(responses) {
  let call = 0;
  return async (url) => {
    const resp = typeof responses === 'function' ? responses(url, call) : responses[call];
    call += 1;
    return resp;
  };
}

function jsonResponse(status, body, headers = {}) {
  const headerMap = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => headerMap.get(k.toLowerCase()) ?? null },
    text: async () => JSON.stringify(body),
  };
}

describe('GitLab connector (mocked fetch — unverified against a real GitLab instance)', () => {
  it('getRepository maps the GitLab project shape', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, {
        path_with_namespace: 'acme/widget', default_branch: 'main', visibility: 'public', web_url: 'https://gitlab.com/acme/widget', description: 'A widget',
      })]),
    });
    const repo = await connector.getRepository({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(repo, { fullName: 'acme/widget', defaultBranch: 'main', private: false, htmlUrl: 'https://gitlab.com/acme/widget', description: 'A widget' });
  });

  it('getRepository treats non-public visibility as private', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, { path_with_namespace: 'acme/private-widget', default_branch: 'main', visibility: 'private', web_url: 'https://gitlab.com/x' })]),
    });
    const repo = await connector.getRepository({ owner: 'acme', repo: 'private-widget' });
    assert.equal(repo.private, true);
  });

  it('resolveCommit maps commit metadata', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, { id: 'abc123', message: 'Fix bug', author_name: 'Jane Doe', authored_date: '2026-01-01T00:00:00Z' })]),
    });
    const commit = await connector.resolveCommit({ owner: 'acme', repo: 'widget', ref: 'main' });
    assert.deepEqual(commit, { sha: 'abc123', message: 'Fix bug', author: 'Jane Doe', date: '2026-01-01T00:00:00Z' });
  });

  it('getTree follows x-next-page pagination until it stops', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([
        jsonResponse(200, [{ id: 'a1', path: 'src/index.js', type: 'blob' }], { 'x-next-page': '2' }),
        jsonResponse(200, [{ id: 'a2', path: 'src/lib', type: 'tree' }], {}),
      ]),
    });
    const tree = await connector.getTree({ owner: 'acme', repo: 'widget', sha: 'main' });
    assert.equal(tree.truncated, false);
    assert.deepEqual(tree.entries, [
      { path: 'src/index.js', type: 'blob', sha: 'a1' },
      { path: 'src/lib', type: 'tree', sha: 'a2' },
    ]);
  });

  it('getTree reports truncated when maxPages is reached with more pages remaining', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch(() => jsonResponse(200, [{ id: 'x', path: 'f', type: 'blob' }], { 'x-next-page': '99' })),
    });
    const tree = await connector.getTree({ owner: 'acme', repo: 'widget', sha: 'main', maxPages: 2 });
    assert.equal(tree.truncated, true);
    assert.equal(tree.entries.length, 2);
  });

  it('getFileContent decodes base64 content', async () => {
    const encoded = Buffer.from('console.log("hi");\n', 'utf-8').toString('base64');
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, { file_path: 'src/index.js', blob_id: 'a1', size: 20, encoding: 'base64', content: encoded })]),
    });
    const file = await connector.getFileContent({ owner: 'acme', repo: 'widget', path: 'src/index.js', ref: 'main' });
    assert.equal(file.content, 'console.log("hi");\n');
    assert.equal(file.truncatedForBudget, false);
  });

  it('listPullRequests maps merge requests to a GitHub-like shape', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, [{ iid: 5, title: 'Add feature', state: 'opened', web_url: 'https://x/5', source_branch: 'feature', target_branch: 'main' }])]),
    });
    const mrs = await connector.listPullRequests({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(mrs, [{ number: 5, title: 'Add feature', state: 'opened', htmlUrl: 'https://x/5', headRef: 'feature', baseRef: 'main' }]);
  });

  it('listIssues maps GitLab issues', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, [{ iid: 1, title: 'Real issue', state: 'opened', web_url: 'https://x/1' }])]),
    });
    const issues = await connector.listIssues({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(issues, [{ number: 1, title: 'Real issue', state: 'opened', htmlUrl: 'https://x/1' }]);
  });

  it('listPipelines maps GitLab CI pipelines (not a 1:1 GitHub-check equivalent)', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(200, [{ id: 42, status: 'success', ref: 'main', sha: 'abc', web_url: 'https://x/pipelines/42' }])]),
    });
    const pipelines = await connector.listPipelines({ owner: 'acme', repo: 'widget' });
    assert.deepEqual(pipelines, [{ id: 42, status: 'success', ref: 'main', sha: 'abc', htmlUrl: 'https://x/pipelines/42' }]);
  });

  it('wraps a 404 as GitlabApiError with status/code "not_found"', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(404, { message: '404 Project Not Found' })]),
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'does-not-exist' }),
      (err) => {
        assert.ok(err instanceof GitlabApiError);
        assert.equal(err.status, 404);
        assert.equal(err.code, 'not_found');
        return true;
      },
    );
  });

  it('joins an array-shaped GitLab error message', async () => {
    const connector = createGitlabConnector({
      fetchImpl: fakeFetch([jsonResponse(400, { message: ['path is invalid', 'ref is required'] })]),
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'bad' }),
      /path is invalid; ref is required/,
    );
  });

  it('wraps a network failure as GitlabApiError with code "network_error"', async () => {
    const connector = createGitlabConnector({
      fetchImpl: async () => { throw new Error('getaddrinfo ENOTFOUND'); },
    });
    await assert.rejects(
      () => connector.getRepository({ owner: 'acme', repo: 'widget' }),
      (err) => {
        assert.ok(err instanceof GitlabApiError);
        assert.equal(err.code, 'network_error');
        assert.match(err.message, /ENOTFOUND/);
        return true;
      },
    );
  });

  it('throws synchronously when no fetch implementation is available', () => {
    assert.throws(() => createGitlabConnector({ fetchImpl: false }), /no fetch implementation available/);
  });
});
