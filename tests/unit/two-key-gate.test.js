/**
 * Unit tests for Two-Key Journal gate logic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sha256Content,
  assertCanSaveDeliverable,
  validateTwoKeyApproval,
  ensureStageTwoKeyFields,
  generateReviewId,
} from '../../babok-mcp/src/lib/two-key-gate.js';

const SAMPLE = '# Charter\n\nGo.';

describe('two-key-gate', () => {
  test('sha256Content is deterministic', () => {
    const a = sha256Content(SAMPLE);
    const b = sha256Content(SAMPLE);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  test('assertCanSaveDeliverable blocks approved without revision', () => {
    const stage = { stage: 0, status: 'approved', revision_open: false };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => assertCanSaveDeliverable(stage), /approved and locked/);
  });

  test('assertCanSaveDeliverable allows approved with revision_open', () => {
    const stage = { stage: 0, status: 'approved', revision_open: true };
    ensureStageTwoKeyFields(stage);
    assert.doesNotThrow(() => assertCanSaveDeliverable(stage));
  });

  test('validateTwoKeyApproval requires matching SHA pair', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 0,
      agent_submission: { content_sha256: sha, review_id: generateReviewId(), at: '2026-01-01' },
      human_attestation: { content_sha256: sha, attestor: 'Human', spot_check_passed: true, at: '2026-01-01' },
      revision_open: false,
    };
    ensureStageTwoKeyFields(stage);
    assert.doesNotThrow(() => validateTwoKeyApproval(stage, sha));
  });

  test('validateTwoKeyApproval rejects SHA mismatch', () => {
    const stage = {
      stage: 1,
      agent_submission: { content_sha256: 'a'.repeat(64), review_id: generateReviewId() },
      human_attestation: { content_sha256: 'b'.repeat(64), spot_check_passed: true },
      revision_open: false,
    };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /mismatch/);
  });

  test('validateTwoKeyApproval rejects missing agent_submission', () => {
    const stage = { stage: 0, human_attestation: { content_sha256: 'x', spot_check_passed: true } };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /agent_submission/);
  });

  test('validateTwoKeyApproval rejects spot_check_passed false', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 0,
      agent_submission: { content_sha256: sha, review_id: generateReviewId() },
      human_attestation: { content_sha256: sha, spot_check_passed: false },
    };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /spot-check/);
  });

  test('validateTwoKeyApproval rejects invalid review_id format', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 0,
      agent_submission: { content_sha256: sha, review_id: 'rev-consulting-example-s0' },
      human_attestation: { content_sha256: sha, spot_check_passed: true },
    };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage, sha), /invalid review_id format/);
  });

  test('validateTwoKeyApproval rejects mock repeated-character hash in deliverable', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 1,
      agent_submission: { content_sha256: sha, review_id: generateReviewId() },
      human_attestation: { content_sha256: sha, spot_check_passed: true },
    };
    ensureStageTwoKeyFields(stage);
    const mockContent = SAMPLE + '\nAttestation hash: 1111111111111111111111111111111111111111111111111111111111111111';
    assert.throws(
      () => validateTwoKeyApproval(stage, sha, { deliverableContent: mockContent }),
      /mock repeated-character hash/,
    );
  });

  test('validateTwoKeyApproval rejects deliverable embedded hash mismatch', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 1,
      agent_submission: { content_sha256: sha, review_id: generateReviewId() },
      human_attestation: { content_sha256: sha, spot_check_passed: true },
    };
    ensureStageTwoKeyFields(stage);
    const nonMatchingHash = '0123456789abcdef'.repeat(4);
    const mockContent = SAMPLE + '\nAttestation hash: ' + nonMatchingHash;
    assert.throws(
      () => validateTwoKeyApproval(stage, sha, { deliverableContent: mockContent }),
      /embedded hash .* does not match content_sha256/,
    );
  });

  test('validateTwoKeyApproval rejects batched approvals with identical second in journal', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 1,
      agent_submission: { content_sha256: sha, review_id: generateReviewId() },
      human_attestation: { content_sha256: sha, spot_check_passed: true },
    };
    ensureStageTwoKeyFields(stage);
    const mockJournal = {
      stages: [
        { stage: 0, status: 'approved', approved_at: '2026-10-16T12:00:00.123Z' },
        { stage: 1, status: 'approved', approved_at: '2026-10-16T12:00:00.456Z' },
      ],
    };
    assert.throws(
      () => validateTwoKeyApproval(stage, sha, { journal: mockJournal }),
      /share identical approved_at second/,
    );
  });
});
