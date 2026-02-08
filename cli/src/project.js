import { nanoid, customAlphabet } from 'nanoid';
import path from 'path';
import fs from 'fs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateSuffix = customAlphabet(ALPHABET, 4);

const STAGES = [
  { stage: 1, name: 'Project Initialization & Stakeholder Mapping' },
  { stage: 2, name: 'Current State Analysis (AS-IS)' },
  { stage: 3, name: 'Problem Domain Analysis' },
  { stage: 4, name: 'Solution Requirements Definition' },
  { stage: 5, name: 'Future State Design (TO-BE)' },
  { stage: 6, name: 'Gap Analysis & Implementation Roadmap' },
  { stage: 7, name: 'Risk Assessment & Mitigation Strategy' },
  { stage: 8, name: 'Business Case & ROI Model' },
];

export { STAGES };

export function getProjectsDir() {
  const cwd = process.cwd();
  return path.join(cwd, 'projects');
}

export function getProjectDir(projectId) {
  return path.join(getProjectsDir(), projectId);
}

export function getJournalPath(projectId) {
  return path.join(getProjectDir(projectId), `PROJECT_JOURNAL_${projectId}.json`);
}

export function generateProjectId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = generateSuffix();
  return `BABOK-${y}${m}${d}-${suffix}`;
}

export function listProjectIds() {
  const dir = getProjectsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(name =>
    name.startsWith('BABOK-') && fs.statSync(path.join(dir, name)).isDirectory()
  );
}

export function resolveProjectId(partialId) {
  const ids = listProjectIds();
  if (!partialId) return ids.length === 1 ? ids[0] : null;
  const exact = ids.find(id => id === partialId);
  if (exact) return exact;
  const matches = ids.filter(id => id.includes(partialId.toUpperCase()));
  return matches.length === 1 ? matches[0] : null;
}
