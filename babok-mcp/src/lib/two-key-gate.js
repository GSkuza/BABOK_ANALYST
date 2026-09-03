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
 * Validate two-key pair before approval.
 * @param {object} stage
 * @param {string} [deliverableSha256] Optional on-disk file hash for extra verification.
 */
export function validateTwoKeyApproval(stage, deliverableSha256) {
  ensureStageTwoKeyFields(stage);

  if (!stage.agent_submission?.content_sha256) {
    throw new Error(
      `Stage ${stage.stage} has no agent_submission. Agent must call babok_submit_for_review after saving the deliverable.`,
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
}

/**
 * @param {string} filePath
 * @returns {string|null} SHA-256 hex or null when file missing.
 */
export function hashFileUtf8(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256Content(fs.readFileSync(filePath, 'utf8'));
}
