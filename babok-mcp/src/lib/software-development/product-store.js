/**
 * Trwały (durable) product & baseline storage for the software-development profile.
 *
 * A `software-development` initiative (a `SD-...` project directory) is one change
 * against a product; the product itself, its repositories, and the evidence-backed
 * baselines built from them are stored independently under `projects/.products/`, so a
 * later initiative can reuse and refresh them instead of rebuilding from zero (see
 * profiles/software-development Stage 1).
 *
 * Layout (relative to getProjectsDir(), the same root used for `<PREFIX>-...` initiative
 * directories — `.products` never matches buildProjectIdRegex(), so it is invisible to
 * listProjectIds()/the CLI project list):
 *
 *   .products/<product_id>/product.json
 *   .products/<product_id>/baselines/<baseline_id>/manifest.json
 *
 * A baseline is immutable once written: createBaseline() always allocates a fresh
 * baseline_id and refuses to overwrite an existing manifest. There is deliberately no
 * "updateBaseline" — a refreshed analysis is a new baseline that supersedes the old one;
 * callers decide which baseline_id an initiative is pinned to.
 *
 * All writes are atomic (write to a sibling temp file, then rename) so a crash mid-write
 * cannot leave a half-written product.json or manifest.json behind.
 *
 * This file is byte-identical in cli/src/software-development/product-store.js and
 * babok-mcp/src/lib/software-development/product-store.js (enforced by
 * tests/unit/lib-parity.test.js).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { customAlphabet } from 'nanoid';
import { getProjectsDir } from '../project.js';
import { validateProduct, validateBaselineManifest } from './schemas.js';

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateProductSuffix = customAlphabet(ID_ALPHABET, 8);
const generateBaselineSuffix = customAlphabet(ID_ALPHABET, 4);

/** @returns {string} */
export function getProductsRootDir() {
  return path.join(getProjectsDir(), '.products');
}

/** @param {string} productId @returns {string} */
export function getProductDir(productId) {
  return path.join(getProductsRootDir(), productId);
}

/** @param {string} productId @returns {string} */
function getProductFilePath(productId) {
  return path.join(getProductDir(productId), 'product.json');
}

/** @param {string} productId @param {string} baselineId @returns {string} */
function getBaselineDir(productId, baselineId) {
  return path.join(getProductDir(productId), 'baselines', baselineId);
}

/** @param {string} productId @param {string} baselineId @returns {string} */
function getBaselineFilePath(productId, baselineId) {
  return path.join(getBaselineDir(productId, baselineId), 'manifest.json');
}

/**
 * Write JSON atomically: same-directory temp file + rename, so a crash mid-write
 * cannot corrupt or truncate the target file.
 * @param {string} filePath
 * @param {object} data
 */
function atomicWriteJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

/** @returns {string} */
export function generateProductId() {
  return `PROD-${generateProductSuffix()}`;
}

/** @returns {string} */
export function generateBaselineId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `BL-${y}${m}${d}-${generateBaselineSuffix()}`;
}

/** @returns {string[]} product ids (directories containing product.json) */
export function listProductIds() {
  const dir = getProductsRootDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'product.json')))
    .map(e => e.name)
    .sort();
}

/**
 * @param {{ name: string, repositories?: object[] }} input
 * @param {{ productId?: string }} [options] - explicit id (tests); generated otherwise
 * @returns {object} the created product record
 */
export function createProduct(input, options = {}) {
  const productId = options.productId || generateProductId();
  const filePath = getProductFilePath(productId);
  if (fs.existsSync(filePath)) {
    throw new Error(`Product "${productId}" already exists`);
  }
  const product = {
    product_id: productId,
    name: input.name,
    created_at: new Date().toISOString(),
    repositories: input.repositories ?? [],
  };
  validateProduct(product);
  atomicWriteJson(filePath, product);
  return product;
}

/**
 * @param {string} productId
 * @returns {object}
 */
export function readProduct(productId) {
  const filePath = getProductFilePath(productId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Product not found: ${productId}`);
  }
  const product = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  validateProduct(product);
  return product;
}

/**
 * Replace a product's current repository list (baselines already written keep their own
 * pinned snapshot regardless of later repository-list changes).
 * @param {string} productId
 * @param {object[]} repositories
 * @returns {object} the updated product record
 */
export function updateProductRepositories(productId, repositories) {
  const product = readProduct(productId);
  product.repositories = repositories;
  product.last_updated = new Date().toISOString();
  validateProduct(product);
  atomicWriteJson(getProductFilePath(productId), product);
  return product;
}

/**
 * @param {string} productId
 * @returns {string[]} baseline ids, oldest first (lexicographic = chronological given the BL-YYYYMMDD-XXXX shape)
 */
export function listBaselineIds(productId) {
  const dir = path.join(getProductDir(productId), 'baselines');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'manifest.json')))
    .map(e => e.name)
    .sort();
}

/**
 * Create a new, immutable baseline for a product. Always allocates a fresh baseline_id;
 * refuses to overwrite an existing one.
 * @param {string} productId
 * @param {{ repositories: object[], evidence?: object[] }} input
 * @param {{ baselineId?: string }} [options] - explicit id (tests); generated otherwise
 * @returns {object} the created baseline manifest
 */
export function createBaseline(productId, input, options = {}) {
  readProduct(productId); // throws if the product does not exist
  const baselineId = options.baselineId || generateBaselineId();
  const filePath = getBaselineFilePath(productId, baselineId);
  if (fs.existsSync(filePath)) {
    throw new Error(`Baseline "${baselineId}" already exists for product "${productId}" — baselines are immutable, allocate a new id`);
  }
  const baseline = {
    ...input,
    baseline_id: baselineId,
    product_id: productId,
    created_at: new Date().toISOString(),
    repositories: input.repositories,
    evidence: input.evidence ?? [],
  };
  validateBaselineManifest(baseline);
  atomicWriteJson(filePath, baseline);
  return baseline;
}

/**
 * @param {string} productId
 * @param {string} baselineId
 * @returns {object}
 */
export function readBaseline(productId, baselineId) {
  const filePath = getBaselineFilePath(productId, baselineId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Baseline not found: ${baselineId} (product ${productId})`);
  }
  const baseline = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  validateBaselineManifest(baseline);
  return baseline;
}

/**
 * @param {string} productId
 * @returns {string|null} the most recently created baseline id, or null if none exist
 */
export function latestBaselineId(productId) {
  const ids = listBaselineIds(productId);
  return ids.length > 0 ? ids[ids.length - 1] : null;
}
