import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { getProjectsDir, getStage, isValidProjectId } from '@/lib/project-store';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = getProjectsDir();
const execFileAsync = promisify(execFile);

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
  if (!isValidProjectId(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  const journalPath = path.join(PROJECTS_DIR, id, `PROJECT_JOURNAL_${id}.json`);
  if (!fs.existsSync(journalPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const cliPath = path.join(REPO_ROOT, 'cli', 'bin', 'babok.js');

  try {
    if (action === 'approve') {
      await execFileAsync('node', [cliPath, 'approve', id, String(stageNum), '--attestor', 'Web UI'], { cwd: REPO_ROOT });
    } else if (action === 'reject') {
      await execFileAsync('node', [cliPath, 'reject', id, String(stageNum), '--reason', reason ?? 'Rejected via Web UI'], { cwd: REPO_ROOT });
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr || '') : '';
    const message = stderr.trim().split('\n').at(-1) || (err instanceof Error ? err.message : 'Stage update failed');
    const status = /already approved/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message.replace(/^Error:\s*/, '') }, { status });
  }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  revalidatePath('/');
  revalidatePath(`/projects/${id}`);
  revalidatePath(`/projects/${id}/stages/${n}`);
  return NextResponse.json({ ok: true });
}
