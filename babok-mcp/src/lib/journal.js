import fs from 'fs';
import { getProjectDir, getJournalPath } from './project.js';
import { DEFAULT_PROFILE_ID, loadProfile, profileIdFromJournal } from './profiles.js';
import {
  assertCanSaveDeliverable,
  ensureStageTwoKeyFields,
  generateReviewId,
  hashFileUtf8,
  normalizeJournalTwoKey,
  validateTwoKeyApproval,
} from './two-key-gate.js';

const STAGE_ENTRY_DEFAULTS = {
  completed_at: null,
  approved_at: null,
  approved_by: null,
  deliverable_file: null,
  notes: '',
  agent_submission: null,
  human_attestation: null,
  revision_open: false,
};

/**
 * @param {object} journal
 * @returns {object}
 */
export function readJournalNormalized(projectId) {
  const journal = readJournal(projectId);
  normalizeJournalTwoKey(journal);
  return journal;
}

export function createJournal(projectId, projectName, language = 'EN', profileId = DEFAULT_PROFILE_ID) {
  const profile = loadProfile(profileId);
  const now = new Date().toISOString();
  const journal = {
    project_id: projectId,
    project_name: projectName,
    profile: profile.id,
    language,
    created_at: now,
    last_updated: now,
    current_stage: 0,
    current_status: 'in_progress',
    stages: profile.stages.map((s, i) => ({
      stage: s.stage,
      name: s.name,
      status: i === 0 ? 'in_progress' : 'not_started',
      started_at: i === 0 ? now : null,
      ...STAGE_ENTRY_DEFAULTS,
    })),
    decisions: [],
    assumptions: [],
    open_questions: [],
  };

  const dir = getProjectDir(projectId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getJournalPath(projectId), JSON.stringify(journal, null, 2), 'utf-8');
  return journal;
}

export function readJournal(projectId) {
  const journalPath = getJournalPath(projectId);
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Journal not found for project: ${projectId}`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  normalizeJournalTwoKey(journal);
  journal.profile = profileIdFromJournal(journal);
  return journal;
}

/** Profile object for an existing project (from its journal). */
export function getProjectProfile(projectId) {
  return loadProfile(readJournal(projectId).profile);
}

export function writeJournal(projectId, journal) {
  journal.last_updated = new Date().toISOString();
  fs.writeFileSync(getJournalPath(projectId), JSON.stringify(journal, null, 2), 'utf-8');
}

/**
 * Agent submits the frozen deliverable snapshot for human review (key 1).
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} contentSha256
 * @param {string} [reviewId]
 */
export function submitForReview(projectId, stageNumber, contentSha256, reviewId) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved' && !stage.revision_open) {
    throw new Error(`Stage ${stageNumber} is approved. Call babok_open_revision to edit.`);
  }

  const now = new Date().toISOString();
  stage.agent_submission = {
    at: now,
    content_sha256: contentSha256,
    review_id: reviewId || generateReviewId(),
  };
  stage.human_attestation = null;
  stage.revision_open = false;
  if (stage.status === 'not_started') {
    stage.status = 'in_progress';
    stage.started_at = stage.started_at || now;
  }

  writeJournal(projectId, journal);
  return journal;
}

/**
 * Human attestation of the reviewed deliverable snapshot (key 2).
 * @param {string} projectId
 * @param {number} stageNumber
 * @param {string} attestor
 * @param {boolean} spotCheckPassed
 * @param {string} contentSha256
 */
export function attestStage(projectId, stageNumber, attestor, spotCheckPassed, contentSha256) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved') throw new Error(`Stage ${stageNumber} is already approved`);

  stage.human_attestation = {
    at: new Date().toISOString(),
    content_sha256: contentSha256,
    attestor: attestor || 'Human',
    spot_check_passed: Boolean(spotCheckPassed),
  };

  writeJournal(projectId, journal);
  return journal;
}

/**
 * Re-open an approved stage for revision; clears two-key state.
 * @param {string} projectId
 * @param {number} stageNumber
 */
export function openRevision(projectId, stageNumber) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status !== 'approved') {
    throw new Error(`Stage ${stageNumber} is not approved (status: ${stage.status}). Nothing to revise.`);
  }

  const now = new Date().toISOString();
  stage.status = 'in_progress';
  stage.revision_open = true;
  stage.agent_submission = null;
  stage.human_attestation = null;
  stage.approved_at = null;
  stage.approved_by = null;
  stage.completed_at = null;
  stage.started_at = stage.started_at || now;
  journal.current_stage = stageNumber;
  journal.current_status = 'in_progress';

  const next = journal.stages.find(s => s.stage === stageNumber + 1);
  if (next && next.status === 'in_progress') {
    next.status = 'not_started';
    next.started_at = null;
  }

  writeJournal(projectId, journal);
  return journal;
}

/**
 * Guard deliverable writes against mutating locked approved stages.
 * @param {object} stage
 */
export function guardSaveDeliverable(stage) {
  assertCanSaveDeliverable(stage);
}

export function approveStage(projectId, stageNumber, notes, deliverableSha256) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved') throw new Error(`Stage ${stageNumber} is already approved`);

  validateTwoKeyApproval(stage, deliverableSha256);

  const now = new Date().toISOString();
  stage.status = 'approved';
  stage.approved_at = now;
  stage.approved_by = stage.human_attestation?.attestor || 'Human';
  stage.revision_open = false;
  if (!stage.completed_at) stage.completed_at = now;
  if (notes) stage.notes = notes;

  const nextStage = journal.stages.find(s => s.stage === stageNumber + 1);
  if (nextStage && nextStage.status === 'not_started') {
    nextStage.status = 'in_progress';
    nextStage.started_at = now;
    journal.current_stage = stageNumber + 1;
    journal.current_status = 'in_progress';
  } else if (!nextStage) {
    journal.current_status = 'completed';
  }

  writeJournal(projectId, journal);
  return journal;
}

export function rejectStage(projectId, stageNumber, reason) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);

  stage.status = 'rejected';
  stage.notes = reason || 'Rejected without reason';
  stage.human_attestation = null;

  writeJournal(projectId, journal);
  return journal;
}
