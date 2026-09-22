import 'server-only';

import fs from 'fs';
import path from 'path';
import type { Project, StageInfo } from '@/lib/babok-client';

export interface StageDetail extends StageInfo {
  deliverable?: string;
  score?: number;
  approved_at?: string | null;
  approved_by?: string | null;
  completed_at?: string | null;
  notes?: string;
}

// Legacy BABOK labels, used only when a journal stage has no name of its own.
export const STAGE_LABELS: Record<number, string> = {
  0: 'Project Charter',
  1: 'Project Initialization',
  2: 'Current State (AS-IS)',
  3: 'Problem Domain',
  4: 'Solution Requirements',
  5: 'Future State (TO-BE)',
  6: 'Gap Analysis & Roadmap',
  7: 'Risk Assessment',
  8: 'Business Case & ROI',
};

const REPO_ROOT = path.join(process.cwd(), '..');
const PROFILES_DIR = path.join(REPO_ROOT, 'profiles');

/** Project-ID prefixes declared by profiles/<id>/profile.json (BABOK always included). */
function readProjectIdPrefixes(): string[] {
  const prefixes = new Set(['BABOK']);
  try {
    for (const entry of fs.readdirSync(PROFILES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const profilePath = path.join(PROFILES_DIR, entry.name, 'profile.json');
      if (!fs.existsSync(profilePath)) continue;
      const prefix = readJsonFile<{ id_prefix?: string }>(profilePath).id_prefix;
      if (prefix && /^[A-Z][A-Z0-9]{1,7}$/.test(prefix)) prefixes.add(prefix);
    }
  } catch {
    // profiles dir optional
  }
  return [...prefixes];
}

// Prefix-based like the CLI/MCP: `babok run` IDs carry a title slug between prefix and date.
export const PROJECT_ID_RE = new RegExp(`^(${readProjectIdPrefixes().join('|')})-[A-Z0-9_-]+$`);

export function isValidProjectId(id: string): boolean {
  return PROJECT_ID_RE.test(id);
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function getJournalPath(id: string) {
  if (!isValidProjectId(id)) {
    return null;
  }
  return path.join(getProjectsDir(), id, `PROJECT_JOURNAL_${id}.json`);
}

function getProjectDir(id: string) {
  if (!isValidProjectId(id)) {
    return null;
  }
  return path.join(getProjectsDir(), id);
}

interface JournalShape {
  project_name: string;
  profile?: string;
  created_at: string;
  last_updated?: string;
  stages?: StageDetail[];
}

export function getProjectsDir() {
  return process.env.BABOK_PROJECTS_DIR
    ? path.resolve(process.env.BABOK_PROJECTS_DIR)
    : path.join(REPO_ROOT, 'projects');
}

export function listProjects(): Project[] {
  const projectsDir = getProjectsDir();
  if (!fs.existsSync(projectsDir)) {
    return [];
  }

  const projects: Project[] = [];
  for (const id of fs.readdirSync(projectsDir)) {
    if (!PROJECT_ID_RE.test(id) || !fs.statSync(path.join(projectsDir, id)).isDirectory()) continue;
    const journalPath = getJournalPath(id);
    if (!journalPath || !fs.existsSync(journalPath)) continue;

    const journal = readJsonFile<JournalShape>(journalPath);
    projects.push({
      id,
      name: journal.project_name,
      profile: journal.profile ?? 'babok',
      stages: journal.stages ?? [],
      createdAt: journal.created_at,
    });
  }

  return projects.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getProject(id: string): Project | null {
  const journalPath = getJournalPath(id);
  if (!journalPath || !fs.existsSync(journalPath)) {
    return null;
  }

  const journal = readJsonFile<JournalShape>(journalPath);
  return {
    id,
    name: journal.project_name,
    profile: journal.profile ?? 'babok',
    stages: journal.stages ?? [],
    createdAt: journal.created_at,
  };
}

export function getStage(id: string, stageNum: number): StageDetail | null {
  const projectDir = getProjectDir(id);
  const journalPath = getJournalPath(id);

  if (!projectDir || !journalPath || !fs.existsSync(journalPath)) {
    return null;
  }

  const journal = readJsonFile<JournalShape>(journalPath);
  const stage = journal.stages?.find((entry) => entry.stage === stageNum);

  if (!stage) {
    return null;
  }

  const prefix = `STAGE_${String(stageNum).padStart(2, '0')}_`;
  const deliverableFile = fs
    .readdirSync(/* turbopackIgnore: true */ projectDir)
    .find((fileName) => fileName.startsWith(prefix) && fileName.endsWith('.md'));

  const deliverable = deliverableFile
    ? fs.readFileSync(
        /* turbopackIgnore: true */ path.join(
          /* turbopackIgnore: true */ projectDir,
          deliverableFile,
        ),
        'utf-8',
      )
    : undefined;

  const scorePath = path.join(projectDir, 'scores', `STAGE_${String(stageNum).padStart(2, '0')}_score.json`);
  let score: number | undefined;

  if (fs.existsSync(scorePath)) {
    const scoreReport = readJsonFile<{ scores?: { overall?: number } }>(scorePath);
    score = scoreReport.scores?.overall;
  }

  return {
    ...stage,
    name: stage.name ?? STAGE_LABELS[stage.stage] ?? `Stage ${stage.stage}`,
    deliverable,
    score,
  };
}
