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
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function getJournalPath(id: string) {
  return path.join(PROJECTS_DIR, id, `PROJECT_JOURNAL_${id}.json`);
}

function getProjectDir(id: string) {
  return path.join(PROJECTS_DIR, id);
}

interface JournalShape {
  project_name: string;
  created_at: string;
  last_updated?: string;
  stages?: StageDetail[];
}

export function listProjects(): Project[] {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(PROJECTS_DIR)
    .filter((name) => name.startsWith('BABOK-') && fs.statSync(path.join(PROJECTS_DIR, name)).isDirectory())
    .map((id) => {
      const journalPath = getJournalPath(id);
      if (!fs.existsSync(journalPath)) {
        return null;
      }

      const journal = readJsonFile<JournalShape>(journalPath);
      return {
        id,
        name: journal.project_name,
        stages: journal.stages ?? [],
        createdAt: journal.created_at,
      } satisfies Project;
    })
    .filter((project): project is Project => project !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getProject(id: string): Project | null {
  const journalPath = getJournalPath(id);
  if (!fs.existsSync(journalPath)) {
    return null;
  }

  const journal = readJsonFile<JournalShape>(journalPath);
  return {
    id,
    name: journal.project_name,
    stages: journal.stages ?? [],
    createdAt: journal.created_at,
  };
}

export function getStage(id: string, stageNum: number): StageDetail | null {
  const projectDir = getProjectDir(id);
  const journalPath = getJournalPath(id);

  if (!fs.existsSync(journalPath)) {
    return null;
  }

  const journal = readJsonFile<JournalShape>(journalPath);
  const stage = journal.stages?.find((entry) => entry.stage === stageNum);

  if (!stage) {
    return null;
  }

  const prefix = `STAGE_${String(stageNum).padStart(2, '0')}_`;
  const deliverableFile = fs
    .readdirSync(projectDir)
    .find((fileName) => fileName.startsWith(prefix) && fileName.endsWith('.md'));

  const deliverable = deliverableFile
    ? fs.readFileSync(path.join(projectDir, deliverableFile), 'utf-8')
    : undefined;

  const scorePath = path.join(projectDir, 'scores', `STAGE_${String(stageNum).padStart(2, '0')}_score.json`);
  let score: number | undefined;

  if (fs.existsSync(scorePath)) {
    const scoreReport = readJsonFile<{ scores?: { overall?: number } }>(scorePath);
    score = scoreReport.scores?.overall;
  }

  return {
    ...stage,
    name: STAGE_LABELS[stage.stage] ?? stage.name,
    deliverable,
    score,
  };
}
