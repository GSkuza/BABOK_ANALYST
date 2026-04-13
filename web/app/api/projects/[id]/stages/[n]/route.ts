import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const stageNum = parseInt(n, 10);
  const projectDir = path.join(PROJECTS_DIR, id);
  const journalPath = path.join(projectDir, `PROJECT_JOURNAL_${id}.json`);
  if (!fs.existsSync(journalPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const j = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  const stage = j.stages?.find((s: { stage: number }) => s.stage === stageNum);
  if (!stage) return NextResponse.json({ error: 'Stage not found' }, { status: 404 });

  const prefix = `STAGE_${String(stageNum).padStart(2, '0')}_`;
  const delivFile = fs.readdirSync(projectDir).find(f => f.startsWith(prefix) && f.endsWith('.md'));
  const deliverable = delivFile ? fs.readFileSync(path.join(projectDir, delivFile), 'utf-8') : undefined;

  const scorePath = path.join(projectDir, 'scores', `STAGE_${String(stageNum).padStart(2, '0')}_score.json`);
  let score: number | undefined;
  if (fs.existsSync(scorePath)) {
    const sr = JSON.parse(fs.readFileSync(scorePath, 'utf-8'));
    score = sr.scores?.overall;
  }

  return NextResponse.json({ ...stage, deliverable, score });
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
  return NextResponse.json({ ok: true });
}
