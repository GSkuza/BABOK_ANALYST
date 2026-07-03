import crypto from 'crypto';
import fs from 'fs';

export function sha256Content(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

export function hashFileUtf8(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return sha256Content(fs.readFileSync(filePath, 'utf8'));
}

function ensureStageTwoKeyFields(stage: {
  agent_submission?: { content_sha256?: string } | null;
  human_attestation?: { content_sha256?: string; spot_check_passed?: boolean } | null;
  revision_open?: boolean;
}) {
  if (stage.agent_submission === undefined) stage.agent_submission = null;
  if (stage.human_attestation === undefined) stage.human_attestation = null;
  if (stage.revision_open === undefined) stage.revision_open = false;
}

export function validateTwoKeyApproval(
  stage: {
    stage: number;
    agent_submission?: { content_sha256?: string } | null;
    human_attestation?: { content_sha256?: string; spot_check_passed?: boolean } | null;
    revision_open?: boolean;
  },
  deliverableSha256?: string | null,
) {
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