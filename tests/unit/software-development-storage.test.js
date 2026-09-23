/**
 * Software-development profile: data contracts (schemas.js) and the trwały
 * product/baseline storage layer (product-store.js). Runs against a temp
 * projects/ directory so it never touches the real projects/ tree.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  validateProduct,
  validateRepositoryRef,
  validateBaselineManifest,
  validateRepositorySnapshot,
  validateEvidenceEntry,
  validateTaskRequest,
  validateTaskResult,
} from '../../cli/src/software-development/schemas.js';

import {
  createProduct,
  readProduct,
  listProductIds,
  updateProductRepositories,
  createBaseline,
  readBaseline,
  listBaselineIds,
  latestBaselineId,
  getProductsRootDir,
} from '../../cli/src/software-development/product-store.js';

import { listProjectIds } from '../../cli/src/project.js';

let tmpBase;
let originalCwd;

before(() => {
  tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-sd-storage-test-'));
  fs.mkdirSync(path.join(tmpBase, 'projects'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tmpBase); // getProjectsDir() resolves ./projects first
});

after(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpBase, { recursive: true, force: true });
});

describe('software-development schemas', () => {
  it('validateRepositoryRef accepts a well-formed repository', () => {
    assert.doesNotThrow(() => validateRepositoryRef({ id: 'r1', host: 'github', owner: 'acme', name: 'checkout-service', role: 'backend' }));
  });

  it('validateRepositoryRef rejects an unknown host', () => {
    assert.throws(() => validateRepositoryRef({ id: 'r1', host: 'bitbucket', owner: 'acme', name: 'x' }), /must be one of github, gitlab, other/);
  });

  it('validateProduct rejects duplicate repository ids', () => {
    const product = {
      product_id: 'PROD-1',
      name: 'X',
      created_at: new Date().toISOString(),
      repositories: [
        { id: 'r1', host: 'github', owner: 'acme', name: 'a' },
        { id: 'r1', host: 'gitlab', owner: 'acme', name: 'b' },
      ],
    };
    assert.throws(() => validateProduct(product), /duplicate repository id/);
  });

  it('validateRepositorySnapshot requires commit_sha when not dirty', () => {
    assert.throws(() => validateRepositorySnapshot({ repository_id: 'r1', ref: 'main', dirty: false }), /requires a non-empty "commit_sha"/);
  });

  it('validateRepositorySnapshot requires dirty_snapshot_id when dirty', () => {
    assert.throws(() => validateRepositorySnapshot({ repository_id: 'r1', ref: 'main', dirty: true }), /requires a non-empty "dirty_snapshot_id"/);
    assert.doesNotThrow(() => validateRepositorySnapshot({ repository_id: 'r1', ref: 'main', dirty: true, dirty_snapshot_id: 'snap-1' }));
  });

  it('validateEvidenceEntry enforces the EV-NNN id pattern', () => {
    assert.throws(() => validateEvidenceEntry({ id: 'E-1', repository_id: 'r1', ref: 'main', claim: 'x' }), /must match EV-NNN/);
    assert.doesNotThrow(() => validateEvidenceEntry({ id: 'EV-001', repository_id: 'r1', ref: 'main', claim: 'x', type: 'fact' }));
  });

  it('validateBaselineManifest rejects duplicate evidence ids', () => {
    const baseline = {
      baseline_id: 'BL-1',
      product_id: 'PROD-1',
      created_at: new Date().toISOString(),
      repositories: [{ repository_id: 'r1', ref: 'main', dirty: false, commit_sha: 'abc123' }],
      evidence: [
        { id: 'EV-001', repository_id: 'r1', ref: 'main', claim: 'a' },
        { id: 'EV-001', repository_id: 'r1', ref: 'main', claim: 'b' },
      ],
    };
    assert.throws(() => validateBaselineManifest(baseline), /duplicate evidence id/);
  });

  it('validateTaskRequest and validateTaskResult accept well-formed records', () => {
    assert.doesNotThrow(() => validateTaskRequest({
      task_id: 't1', initiative_id: 'SD-20260101-AAAA', stage: 1, kind: 'baseline', inputs: {}, created_at: new Date().toISOString(),
    }));
    assert.doesNotThrow(() => validateTaskResult({ task_id: 't1', status: 'completed', executor: 'api' }));
    assert.throws(() => validateTaskResult({ task_id: 't1', status: 'done', executor: 'api' }), /must be one of/);
  });
});

describe('product-store', () => {
  it('creates and reads a product', () => {
    const product = createProduct({
      name: 'Nordwind Storefront',
      repositories: [{ id: 'web', host: 'github', owner: 'nordwind', name: 'storefront-web', role: 'frontend' }],
    });
    assert.match(product.product_id, /^PROD-[A-Z0-9]{8}$/);
    const reread = readProduct(product.product_id);
    assert.deepEqual(reread, product);
  });

  it('lists product ids and excludes them from listProjectIds()', () => {
    const product = createProduct({ name: 'Another Product' });
    assert.ok(listProductIds().includes(product.product_id));
    // .products/ must never leak into the SD-/BABOK-/BC- initiative listing
    assert.ok(!listProjectIds().includes(product.product_id));
  });

  it('rejects creating a product with an id that already exists', () => {
    createProduct({ name: 'Dup' }, { productId: 'PROD-DUPTEST1' });
    assert.throws(() => createProduct({ name: 'Dup Again' }, { productId: 'PROD-DUPTEST1' }), /already exists/);
  });

  it('updateProductRepositories replaces the repository list', () => {
    const product = createProduct({ name: 'To Update' }, { productId: 'PROD-UPDATETEST' });
    assert.deepEqual(product.repositories, []);
    const updated = updateProductRepositories('PROD-UPDATETEST', [
      { id: 'api', host: 'gitlab', owner: 'nordwind-platform', name: 'checkout-service', role: 'backend' },
    ]);
    assert.equal(updated.repositories.length, 1);
    assert.equal(readProduct('PROD-UPDATETEST').repositories[0].id, 'api');
  });

  it('readProduct throws for an unknown product', () => {
    assert.throws(() => readProduct('PROD-DOES-NOT-EXIST'), /Product not found/);
  });

  it('creates an immutable baseline and refuses to overwrite it', () => {
    createProduct({ name: 'Baseline Product' }, { productId: 'PROD-BASELINETEST' });
    const baseline = createBaseline('PROD-BASELINETEST', {
      repositories: [{ repository_id: 'web', ref: 'main', dirty: false, commit_sha: 'abcdef1' }],
      evidence: [{ id: 'EV-001', repository_id: 'web', ref: 'main', claim: 'Entry point is src/index.js' }],
    }, { baselineId: 'BL-FIXED-0001' });
    assert.equal(baseline.baseline_id, 'BL-FIXED-0001');
    assert.throws(
      () => createBaseline('PROD-BASELINETEST', { repositories: baseline.repositories }, { baselineId: 'BL-FIXED-0001' }),
      /baselines are immutable/,
    );
  });

  it('createBaseline throws for an unknown product', () => {
    assert.throws(() => createBaseline('PROD-NOPE', { repositories: [] }), /Product not found/);
  });

  it('lists baselines chronologically and reports the latest', () => {
    createProduct({ name: 'Multi Baseline Product' }, { productId: 'PROD-MULTIBASELINE' });
    assert.equal(latestBaselineId('PROD-MULTIBASELINE'), null);
    createBaseline('PROD-MULTIBASELINE', { repositories: [] }, { baselineId: 'BL-20260101-AAAA' });
    createBaseline('PROD-MULTIBASELINE', { repositories: [] }, { baselineId: 'BL-20260201-BBBB' });
    assert.deepEqual(listBaselineIds('PROD-MULTIBASELINE'), ['BL-20260101-AAAA', 'BL-20260201-BBBB']);
    assert.equal(latestBaselineId('PROD-MULTIBASELINE'), 'BL-20260201-BBBB');
    assert.equal(readBaseline('PROD-MULTIBASELINE', 'BL-20260101-AAAA').baseline_id, 'BL-20260101-AAAA');
  });

  it('readBaseline throws for an unknown baseline', () => {
    createProduct({ name: 'No Baselines' }, { productId: 'PROD-NOBASELINES' });
    assert.throws(() => readBaseline('PROD-NOBASELINES', 'BL-NOPE'), /Baseline not found/);
  });

  it('stores products under a .products root that does not collide with initiative directories', () => {
    assert.equal(path.basename(getProductsRootDir()), '.products');
  });
});
