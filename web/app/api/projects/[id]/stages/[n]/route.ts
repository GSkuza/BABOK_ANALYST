import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs';
import { getStage } from '@/lib/project-store';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNum = parseInt(n, 10);
  const stage = getStage(id, stageNum);
  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  return NextResponse.json(stage);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNum = parseInt(n, 10);
  const { action, reason } = await req.json();
  const journalPath = path.join(PROJECTS_DIR, id, `PROJECT_JOURNAL_${id}.json`);
  if (!fs.existsSync(journalPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const j = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  const stage = j.stages?.find((s: { stage: number }) => s.stage === stageNum);
  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 });

  const now = new Date().toISOString();
  if (action === 'approve') {
    stage.status = 'approved'; stage.approved_at = now; stage.approved_by = 'Web UI';
  } else if (action === 'reject') {
    stage.status = 'rejected'; stage.notes = reason ?? 'Rejected via Web UI';
  } else {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  j.last_updated = now;
  fs.writeFileSync(journalPath, JSON.stringify(j, null, 2));
  revalidatePath('/');
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${id}/stages/${n}`);
  return NextResponse.json({ ok: true });
}
