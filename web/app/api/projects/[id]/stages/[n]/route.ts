import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs';
import { getProjectsDir, getStage, isValidProjectId } from '@/lib/project-store';
import { StageActionError, runStageAction } from '@/lib/stage-actions';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNum = parseInt(n, 10);
  if (!isValidProjectId(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  const stage = getStage(id, stageNum);
  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
  return NextResponse.json(stage);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNum = parseInt(n, 10);
  const { action, reason } = await req.json();
  const projectsDir = getProjectsDir();
  if (!isValidProjectId(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  if (!Number.isInteger(stageNum)) {
    return NextResponse.json({ error: 'Invalid stage number' }, { status: 400 });
  }
  const journalPath = path.join(projectsDir, id, `PROJECT_JOURNAL_${id}.json`);
  if (!fs.existsSync(journalPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    await runStageAction(id, stageNum, action, reason);
  } catch (err) {
    if (err instanceof StageActionError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Stage update failed' }, { status: 500 });
  }
  revalidatePath('/');
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${id}/stages/${n}`);
  return NextResponse.json({ ok: true });
}
