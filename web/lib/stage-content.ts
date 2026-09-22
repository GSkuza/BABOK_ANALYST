import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAX_CONTENT_BYTES = 5 * 1024 * 1024;
const LOCK_STALE_MS = 120 * 60 * 1000;

interface JournalStage {
  stage: number;
  status: string;
  deliverable_file?: string | null;
  revision_open?: boolean;
  agent_submission?: unknown;
  human_attestation?: unknown;
  started_at?: string | null;
  completed_at?: string | null;
}

interface Journal {
  profile?: string;
  last_updated?: string;
  stages: JournalStage[];
}

interface Profile {
  stages: Array<{ stage: number; deliverable_file: string }>;
}

interface SaveOptions {
  projectsDir?: string;
  profilesDir?: string;
}

export class StageContentError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'StageContentError';
    this.status = status;
  }
}

function writeJsonAtomic(filePath: string, value: unknown) {
  const temporaryPath = `${filePath}.web-${process.pid}-${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

function acquireStageLock(projectDir: string, stageNumber: number) {
  const lockPath = path.join(projectDir, `.stage_${stageNumber}.lock`);
  if (fs.existsSync(lockPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(lockPath, 'utf-8')) as {
        locked_by?: string;
        hostname?: string;
        pid?: number;
        locked_at?: string;
      };
      const age = Date.now() - new Date(existing.locked_at ?? '').getTime();
      if (Number.isFinite(age) && age <= LOCK_STALE_MS) {
        throw new StageContentError(
          `Stage ${stageNumber} is locked by ${existing.locked_by ?? 'another user'}@${existing.hostname ?? 'unknown host'} (PID ${existing.pid ?? 'unknown'}).`,
          409,
        );
      }
      fs.unlinkSync(lockPath);
    } catch (error) {
      if (error instanceof StageContentError) throw error;
      fs.unlinkSync(lockPath);
    }
  }

  try {
    fs.writeFileSync(
      lockPath,
      JSON.stringify({
        locked_by: 'Web UI',
        hostname: os.hostname(),
        pid: process.pid,
        locked_at: new Date().toISOString(),
      }, null, 2),
      { encoding: 'utf-8', flag: 'wx' },
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
      throw new StageContentError(`Stage ${stageNumber} was locked by another editor. Try again.`, 409);
    }
    throw error;
  }

  return () => {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  };
}

export function withStageWriteLock<T>(
  projectDir: string,
  stageNumber: number,
  operation: () => T,
) {
  const releaseLock = acquireStageLock(projectDir, stageNumber);
  try {
    return operation();
  } finally {
    releaseLock();
  }
}

function resolveDeliverableFile(stage: JournalStage, profile: Profile, stageNumber: number) {
  const fileName = stage.deliverable_file
    ?? profile.stages.find((profileStage) => profileStage.stage === stageNumber)?.deliverable_file;

  if (
    !fileName
    || path.basename(fileName) !== fileName
    || !new RegExp(`^STAGE_${String(stageNumber).padStart(2, '0')}_.+\\.md$`).test(fileName)
  ) {
    throw new StageContentError(`No valid deliverable file is configured for stage ${stageNumber}.`, 500);
  }
  return fileName;
}

export function saveStageDraft(
  projectId: string,
  stageNumber: number,
  content: string,
  options: SaveOptions = {},
) {
  if (path.basename(projectId) !== projectId || !Number.isInteger(stageNumber) || stageNumber < 0) {
    throw new StageContentError('Invalid project or stage.');
  }
  if (typeof content !== 'string') {
    throw new StageContentError('Content must be a string.');
  }
  if (Buffer.byteLength(content, 'utf-8') > MAX_CONTENT_BYTES) {
    throw new StageContentError('Content exceeds the 5 MB limit.', 413);
  }

  const projectsDir = options.projectsDir
    ?? (process.env.BABOK_PROJECTS_DIR ? path.resolve(process.env.BABOK_PROJECTS_DIR) : path.join(REPO_ROOT, 'projects'));
  const profilesDir = options.profilesDir ?? path.join(REPO_ROOT, 'profiles');
  const projectDir = path.join(projectsDir, projectId);
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${projectId}.json`);

  if (!fs.existsSync(journalPath)) {
    throw new StageContentError('Project not found.', 404);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8')) as Journal;
  const stage = journal.stages.find((entry) => entry.stage === stageNumber);
  if (!stage) {
    throw new StageContentError('Stage not found.', 404);
  }
  if (stage.status === 'approved' && !stage.revision_open) {
    throw new StageContentError(
      `Stage ${stageNumber} is approved and locked. Open a revision before editing.`,
      409,
    );
  }

  const profileId = journal.profile ?? 'babok';
  const profilePath = path.join(profilesDir, profileId, 'profile.json');
  if (!fs.existsSync(profilePath)) {
    throw new StageContentError(`Profile "${profileId}" is not available.`, 500);
  }
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as Profile;
  const fileName = resolveDeliverableFile(stage, profile, stageNumber);
  const now = new Date().toISOString();
  withStageWriteLock(projectDir, stageNumber, () => {
    fs.writeFileSync(path.join(projectDir, fileName), content, 'utf-8');
    stage.deliverable_file = fileName;
    stage.status = 'in_progress';
    stage.started_at ??= now;
    stage.completed_at = null;
    stage.agent_submission = null;
    stage.human_attestation = null;
    journal.last_updated = now;
    writeJsonAtomic(journalPath, journal);
  });

  return { fileName, updatedAt: now };
}
