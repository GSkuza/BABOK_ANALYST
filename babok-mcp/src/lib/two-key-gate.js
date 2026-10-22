/**
 * Two-Key Journal gate — content-anchored human attestation for stage approval.
 *
 * A stage may transition to `approved` only when `agent_submission` and
 * `human_attestation` exist and share the same `content_sha256`.
 */

import crypto from 'crypto';
import fs from 'fs';

/**
 * SHA-256 hex digest of UTF-8 deliverable content.
 * @param {string} content
 * @returns {string}
 */
export function sha256Content(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * @returns {string} Opaque review identifier for agent submission audit trail.
 */
export function generateReviewId() {
  const suffix = crypto.randomBytes(4).toString('hex');
  return `rev-${Date.now().toString(36)}-${suffix}`;
}

/**
 * Ensure two-key fields exist on a stage record (legacy journal compatibility).
 * @param {object} stage
 */
export function ensureStageTwoKeyFields(stage) {
  if (stage.agent_submission === undefined) stage.agent_submission = null;
  if (stage.human_attestation === undefined) stage.human_attestation = null;
  if (stage.revision_open === undefined) stage.revision_open = false;
}

/**
 * @param {object} journal
 */
export function normalizeJournalTwoKey(journal) {
  if (!journal?.stages) return;
  for (const stage of journal.stages) {
    ensureStageTwoKeyFields(stage);
  }
}

/**
 * Block saving a deliverable on an approved stage unless revision is explicitly open.
 * @param {object} stage
 */
export function assertCanSaveDeliverable(stage) {
  ensureStageTwoKeyFields(stage);
  if (stage.status === 'approved' && !stage.revision_open) {
    throw new Error(
      `Stage ${stage.stage} is approved and locked. Open a revision first (babok open-revision / babok_open_revision) before saving.`,
    );
  }
}

/**
 * Check if reviewId matches generated pattern rev-<base36>-<hex8>.
 * @param {string} reviewId
 * @returns {boolean}
 */
export function isValidReviewId(reviewId) {
  return typeof reviewId === 'string' && /^rev-[a-z0-9]+-[a-f0-9]{8}$/i.test(reviewId);
}

/**
 * Validate that deliverable markdown does not contain a repeated-char mock hash
 * and that any embedded hash matches content_sha256.
 * @param {string} content
 * @param {string} [expectedSha256]
 * @param {number} [stageNumber]
 */
export function validateDeliverableHash(content, expectedSha256, stageNumber = 0) {
  if (!content || typeof content !== 'string') return;

  // Reject repeated-character hashes (e.g. 1111..., 2222...)
  if (/([a-f0-9])\1{15,}/i.test(content)) {
    throw new Error(`Two-Key Gate: stage ${stageNumber} deliverable contains a mock repeated-character hash.`);
  }

  // If deliverable contains an explicit hash declaration, verify it matches
  const match =
    content.match(/(?:signature|attestation)?\s*hash:\s*([a-f0-9]{64})/i) ||
    content.match(/\|\s*Signature Hash\s*\|\s*([a-f0-9]{64})\s*\|/i);

  if (match) {
    const embeddedHash = match[1].toLowerCase();
    if (expectedSha256 && embeddedHash !== expectedSha256.toLowerCase()) {
      throw new Error(
        `Two-Key Gate: embedded hash in stage ${stageNumber} deliverable (${embeddedHash.slice(0, 12)}…) does not match content_sha256 (${expectedSha256.slice(0, 12)}…).`,
      );
    }
  }
}

/**
 * Warn if any two approved stages share identical approved_at timestamp up to the second.
 * Returns an array of warnings without throwing.
 * @param {object} journal
 * @returns {Array<{rule: string, message: string}>}
 */
export function validateJournalApprovalTimestamps(journal) {
  if (!journal?.stages) return [];
  const warnings = [];
  const seenSeconds = new Map();
  for (const stage of journal.stages) {
    if (stage.status === 'approved' && stage.approved_at) {
      const sec = new Date(stage.approved_at).toISOString().slice(0, 19);
      if (seenSeconds.has(sec)) {
        const prior = seenSeconds.get(sec);
        warnings.push({
          rule: 'identical_approval_timestamps',
          message: `Two-Key Gate warning: stages ${prior} and ${stage.stage} share identical approved_at second (${sec}).`,
        });
      }
      seenSeconds.set(sec, stage.stage);
    }
  }
  return warnings;
}

/**
 * Validate two-key pair before approval.
 * @param {object} stage
 * @param {string} [deliverableSha256] Optional on-disk file hash for extra verification.
 * @param {object} [options] Optional extra verification context (deliverableContent, journal).
 */
export function validateTwoKeyApproval(stage, deliverableSha256, options = {}) {
  ensureStageTwoKeyFields(stage);

  if (!stage.agent_submission?.content_sha256) {
    throw new Error(
      `Stage ${stage.stage} has no agent_submission. Agent must call babok_submit_for_review after saving the deliverable.`,
    );
  }

  const reviewId = stage.agent_submission.review_id;
  if (!isValidReviewId(reviewId)) {
    throw new Error(
      `Two-Key Gate: invalid review_id format for stage ${stage.stage}: "${reviewId || ''}". Expected rev-<base36>-<hex8>.`,
    );
  }

  if (!stage.human_attestation?.content_sha256) {
    throw new Error(
      `Stage ${stage.stage} has no human_attestation. Human must run: babok approve <id> ${stage.stage}`,
    );
  }
  if (!stage.human_attestation.spot_check_passed) {
    throw new Error(
      `Stage ${stage.stage} human attestation failed spot-check gate (spot_check_passed is false).`,
    );
  }

  const agentSha = stage.agent_submission.content_sha256;
  const humanSha = stage.human_attestation.content_sha256;

  if (agentSha !== humanSha) {
    throw new Error(
      `Two-Key Gate: content_sha256 mismatch for stage ${stage.stage}. ` +
        `Agent submitted ${agentSha.slice(0, 12)}… but human attested ${humanSha.slice(0, 12)}…. ` +
        'Re-submit for review after aligning the deliverable.',
    );
  }

  if (deliverableSha256 && deliverableSha256 !== agentSha) {
    throw new Error(
      `Two-Key Gate: on-disk deliverable hash does not match agent_submission for stage ${stage.stage}. ` +
        'The file changed after review submission.',
    );
  }

  if (options.deliverableContent) {
    validateDeliverableHash(options.deliverableContent, agentSha, stage.stage);
  }

  if (options.journal) {
    validateJournalApprovalTimestamps(options.journal);
  }
}

/**
 * @param {string} filePath
 * @returns {string|null} SHA-256 hex or null when file missing.
 */
export function hashFileUtf8(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256Content(fs.readFileSync(filePath, 'utf8'));
}
