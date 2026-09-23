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
  ['cli/src/quality/checks/completeness.js', 'babok-mcp/src/lib/quality/checks/completeness.js'],
  ['cli/src/quality/checks/smart.js', 'babok-mcp/src/lib/quality/checks/smart.js'],
  ['cli/src/quality/checks/consistency.js', 'babok-mcp/src/lib/quality/checks/consistency.js'],
  ['cli/src/quality/checks/depth.js', 'babok-mcp/src/lib/quality/checks/depth.js'],
  ['cli/src/quality/score-content.js', 'babok-mcp/src/lib/quality/score-content.js'],
  ['cli/src/quality/prompts/depth_judge.md', 'babok-mcp/src/lib/quality/prompts/depth_judge.md'],
  ['cli/src/software-development/schemas.js', 'babok-mcp/src/lib/software-development/schemas.js'],
  ['cli/src/software-development/product-store.js', 'babok-mcp/src/lib/software-development/product-store.js'],
  ['cli/src/software-development/hosting/github.js', 'babok-mcp/src/lib/software-development/hosting/github.js'],
  ['cli/src/software-development/hosting/gitlab.js', 'babok-mcp/src/lib/software-development/hosting/gitlab.js'],
  ['cli/src/software-development/repository-analyzer.js', 'babok-mcp/src/lib/software-development/repository-analyzer.js'],
  ['cli/src/software-development/baseline-builder.js', 'babok-mcp/src/lib/software-development/baseline-builder.js'],
  ['cli/src/software-development/runtime/task-store.js', 'babok-mcp/src/lib/software-development/runtime/task-store.js'],
  ['cli/src/software-development/runtime/api-executor.js', 'babok-mcp/src/lib/software-development/runtime/api-executor.js'],
  ['cli/src/software-development/runtime/host-task.js', 'babok-mcp/src/lib/software-development/runtime/host-task.js'],
  ['cli/src/software-development/runtime/execution-authorization.js', 'babok-mcp/src/lib/software-development/runtime/execution-authorization.js'],
  ['cli/src/software-development/runtime/code-executor.js', 'babok-mcp/src/lib/software-development/runtime/code-executor.js'],
  ['cli/src/software-development/outcomes/deployment-record.js', 'babok-mcp/src/lib/software-development/outcomes/deployment-record.js'],
  ['cli/src/software-development/outcomes/kpi-tracker.js', 'babok-mcp/src/lib/software-development/outcomes/kpi-tracker.js'],
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
