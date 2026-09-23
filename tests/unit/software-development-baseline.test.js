/**
 * Repository analyzer + baseline builder: mocked-connector unit tests plus a
 * real end-to-end test against the authenticated GitHub connector reading the
 * actual GSkuza/BABOK_ANALYST repository (read-only — no writes, no LLM key
 * required since the mechanical evidence path works standalone).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

import { analyzeRepository } from '../../cli/src/software-development/repository-analyzer.js';
import { buildBaseline } from '../../cli/src/software-development/baseline-builder.js';
import { createProduct, readBaseline } from '../../cli/src/software-development/product-store.js';
import { createGithubConnector } from '../../cli/src/software-development/hosting/github.js';

let tmpBase;
let originalCwd;

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-baseline-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase);
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

/** A minimal fake connector driving analyzeRepository/buildBaseline without any network I/O. */
function fakeConnector({ defaultBranch = 'main', sha = 'a'.repeat(40), tree, files }) {
  return {
    async getRepository() { return { fullName: 'acme/widget', defaultBranch, private: false, htmlUrl: 'https://x', description: null }; },
    async resolveCommit() { return { sha, message: 'msg', author: 'a', date: '2026-01-01T00:00:00Z' }; },
    async getTree() { return tree; },
    async getFileContent({ path: filePath }) {
      if (!(filePath in files)) throw new Error(`fakeConnector: no fixture for ${filePath}`);
      return { path: filePath, sha: 'f1', size: files[filePath].length, content: files[filePath], truncatedForBudget: false };
    },
  };
}

describe('repository-analyzer (mocked connector)', () => {
  it('detects an npm manifest, CI config and a test directory', async () => {
    const pkg = JSON.stringify({ name: 'widget', version: '1.0.0', dependencies: { react: '^19.0.0' }, devDependencies: { eslint: '^9.0.0' }, scripts: { test: 'node --test' } });
    const connector = fakeConnector({
      tree: { truncated: false, entries: [
        { path: 'package.json', type: 'blob' },
        { path: '.github/workflows/ci.yml', type: 'blob' },
        { path: 'tests/foo.test.js', type: 'blob' },
        { path: 'src/index.js', type: 'blob' },
      ] },
      files: { 'package.json': pkg },
    });
    const analysis = await analyzeRepository({ connector, owner: 'acme', repo: 'widget', repositoryId: 'r1' });
    assert.equal(analysis.manifests.length, 1);
    assert.match(analysis.manifests[0].claim, /widget.*1 runtime dependencies.*1 dev dependencies.*scripts: test/);
    assert.deepEqual(analysis.ciConfigPaths, ['.github/workflows/ci.yml']);
    assert.deepEqual(analysis.testDirectories, ['tests']);
    assert.ok(analysis.evidence.every(e => /^EV-\d{3}$/.test(e.id)));
    assert.ok(analysis.evidence.every(e => e.repository_id === 'r1'));
  });

  it('reports absence of CI config and test directories as assumptions, not silent gaps', async () => {
    const connector = fakeConnector({ tree: { truncated: false, entries: [{ path: 'README.md', type: 'blob' }] }, files: {} });
    const analysis = await analyzeRepository({ connector, owner: 'acme', repo: 'bare', repositoryId: 'r1' });
    assert.equal(analysis.ciConfigPaths.length, 0);
    assert.equal(analysis.testDirectories.length, 0);
    const ciEvidence = analysis.evidence.find(e => /CI\/CD/.test(e.claim));
    assert.equal(ciEvidence.type, 'assumption');
  });

  it('caps manifest reads at the budget and discloses the exclusion', async () => {
    const entries = Array.from({ length: 15 }, (_, i) => ({ path: `pkg${i}/package.json`, type: 'blob' }));
    const files = Object.fromEntries(entries.map(e => [e.path, '{"name":"x"}']));
    const connector = fakeConnector({ tree: { truncated: false, entries }, files });
    const analysis = await analyzeRepository({ connector, owner: 'acme', repo: 'many', repositoryId: 'r1', maxManifests: 3 });
    assert.equal(analysis.manifests.length, 3);
    assert.ok(analysis.excluded.some(e => /budget cap 3/.test(e)));
  });

  it('discloses a truncated tree listing', async () => {
    const connector = fakeConnector({ tree: { truncated: true, entries: [] }, files: {} });
    const analysis = await analyzeRepository({ connector, owner: 'acme', repo: 'huge', repositoryId: 'r1' });
    assert.ok(analysis.excluded.some(e => /truncated/.test(e)));
  });
});

describe('baseline-builder (mocked connector)', () => {
  it('builds and persists an immutable baseline from mechanical evidence, no LLM required', async () => {
    createProduct({ name: 'Widget Product', repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget', role: 'backend' }] }, { productId: 'PROD-BUILDTEST' });
    const connector = fakeConnector({
      tree: { truncated: false, entries: [{ path: 'package.json', type: 'blob' }, { path: 'test/a.test.js', type: 'blob' }] },
      files: { 'package.json': '{"name":"widget"}' },
    });
    const result = await buildBaseline({
      productId: 'PROD-BUILDTEST',
      repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }],
      connectors: { github: connector },
    });
    assert.match(result.baseline.baseline_id, /^BL-\d{8}-[A-Z0-9]{4}$/);
    assert.equal(result.narrative, null);
    assert.equal(result.baseline.repositories[0].dirty, false);
    assert.ok(result.baseline.evidence.length > 0);

    const reread = readBaseline('PROD-BUILDTEST', result.baseline.baseline_id);
    assert.deepEqual(reread, result.baseline);
  });

  it('calls the LLM client for narrative synthesis when provided, grounded in the evidence', async () => {
    createProduct({ name: 'Narrated Product' }, { productId: 'PROD-NARRATED' });
    const connector = fakeConnector({ tree: { truncated: false, entries: [{ path: 'package.json', type: 'blob' }] }, files: { 'package.json': '{"name":"n"}' } });
    let seenPrompt = null;
    const llmClient = { chat: async (system, user) => { seenPrompt = { system, user }; return 'Business Context: ... (EV-001)'; } };
    const result = await buildBaseline({
      productId: 'PROD-NARRATED',
      repositories: [{ id: 'r1', host: 'github', owner: 'acme', name: 'widget' }],
      connectors: { github: connector },
      llmClient,
    });
    assert.equal(result.narrative, 'Business Context: ... (EV-001)');
    assert.equal(result.baseline.narrative, 'Business Context: ... (EV-001)');
    assert.match(seenPrompt.user, /EV-001/);
  });

  it('throws a clear error when no connector is configured for a repository host', async () => {
    createProduct({ name: 'Missing Connector Product' }, { productId: 'PROD-NOCONN' });
    await assert.rejects(
      () => buildBaseline({ productId: 'PROD-NOCONN', repositories: [{ id: 'r1', host: 'gitlab', owner: 'acme', name: 'x' }], connectors: {} }),
      /no connector configured for host "gitlab"/,
    );
  });
});

function ghAuthenticated() {
  try { execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' }); return true; } catch { return false; }
}
const skipReason = ghAuthenticated() ? false : '`gh` is not authenticated in this environment';

describe('baseline-builder (live GitHub, GSkuza/BABOK_ANALYST, read-only)', { skip: skipReason }, () => {
  it('builds a real, evidence-backed baseline for the actual repository', async () => {
    createProduct({ name: 'BABOK Analyst (live)', repositories: [{ id: 'main', host: 'github', owner: 'GSkuza', name: 'BABOK_ANALYST', role: 'monorepo' }] }, { productId: 'PROD-LIVEBABOK' });
    const github = createGithubConnector();
    const result = await buildBaseline({
      productId: 'PROD-LIVEBABOK',
      repositories: [{ id: 'main', host: 'github', owner: 'GSkuza', name: 'BABOK_ANALYST' }],
      connectors: { github },
    });

    assert.match(result.baseline.repositories[0].commit_sha, /^[0-9a-f]{40}$/);
    assert.ok(result.baseline.evidence.length >= 4, 'expected several real evidence entries');

    const { analysis } = result.analyses[0];
    assert.ok(analysis.fileCount > 100);
    // The repository's own root package.json must be found and actually parsed.
    const rootPkg = analysis.manifests.find(m => m.path === 'package.json');
    assert.ok(rootPkg, 'expected the root package.json to be detected');
    assert.match(rootPkg.claim, /babok-analyst/);
    // Real CI/CD workflows live under .github/workflows in this repository.
    assert.ok(analysis.ciConfigPaths.some(p => p.startsWith('.github/workflows/')));
    // Real test directory.
    assert.ok(analysis.testDirectories.includes('tests'));

    const reread = readBaseline('PROD-LIVEBABOK', result.baseline.baseline_id);
    assert.deepEqual(reread, result.baseline);
  });
});
