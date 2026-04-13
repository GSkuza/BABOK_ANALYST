import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const journalPath = path.join(PROJECTS_DIR, id, `PROJECT_JOURNAL_${id}.json`);
  if (!fs.existsSync(journalPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const j = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  return NextResponse.json({ id, name: j.project_name, stages: j.stages, createdAt: j.created_at });
}
