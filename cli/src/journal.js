import fs from 'fs';
import path from 'path';
import { getProjectDir, getJournalPath, STAGES } from './project.js';

export function createJournal(projectId, projectName, language = 'EN') {
  const now = new Date().toISOString();
  const journal = {
    project_id: projectId,
    project_name: projectName,
    language: language,
    created_at: now,
    last_updated: now,
    current_stage: 1,
    current_status: 'in_progress',
    stages: STAGES.map((s, i) => ({
      stage: s.stage,
      name: s.name,
      status: i === 0 ? 'in_progress' : 'not_started',
      started_at: i === 0 ? now : null,
      completed_at: null,
      approved_at: null,
      approved_by: null,
      deliverable_file: null,
      notes: '',
    })),
    decisions: [],
    assumptions: [],
    open_questions: [],
  };

  const dir = getProjectDir(projectId);
  fs.mkdirSync(dir, { recursive: true });

  const journalPath = getJournalPath(projectId);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
  return journal;
}

export function readJournal(projectId) {
  const journalPath = getJournalPath(projectId);
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Journal not found for project: ${projectId}`);
  }
  return JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
}

export function writeJournal(projectId, journal) {
  journal.last_updated = new Date().toISOString();
  const journalPath = getJournalPath(projectId);
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2), 'utf-8');
}

export function approveStage(projectId, stageNumber) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved') throw new Error(`Stage ${stageNumber} is already approved`);

  const now = new Date().toISOString();
  stage.status = 'approved';
  stage.approved_at = now;
  stage.approved_by = 'Human';
  if (!stage.completed_at) stage.completed_at = now;

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

  writeJournal(projectId, journal);
  return journal;
}

export function updateStageStatus(projectId, stageNumber, status, notes) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);

  const now = new Date().toISOString();
  stage.status = status;
  if (notes) stage.notes = notes;
  if (status === 'in_progress' && !stage.started_at) stage.started_at = now;
  if (status === 'completed') stage.completed_at = now;

  journal.current_stage = stageNumber;
  journal.current_status = status;

  writeJournal(projectId, journal);
  return journal;
}
