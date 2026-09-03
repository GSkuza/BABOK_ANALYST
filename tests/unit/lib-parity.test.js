/**
 * Guards against drift between the CLI and MCP copies of shared libraries.
 * The two packages deliberately duplicate these files instead of sharing a
 * package; this test turns "keep them in sync" from a comment into a failure.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const MIRRORED = [
  ['cli/src/profiles.js', 'babok-mcp/src/lib/profiles.js'],
  ['cli/src/two-key-gate.js', 'babok-mcp/src/lib/two-key-gate.js'],
];

const normalize = (s) => s.replace(/\r\n/g, '\n');

describe('cli/ and babok-mcp/ shared library parity', () => {
  for (const [a, b] of MIRRORED) {
    it(`${a} is identical to ${b}`, () => {
      const left = normalize(fs.readFileSync(path.join(ROOT, a), 'utf-8'));
      const right = normalize(fs.readFileSync(path.join(ROOT, b), 'utf-8'));
      assert.equal(left, right, `${a} and ${b} have drifted — copy one over the other`);
    });
  }
});
