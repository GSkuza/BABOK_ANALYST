import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

function listProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  return fs.readdirSync(PROJECTS_DIR)
    .filter(n => n.startsWith('BABOK-') && fs.statSync(path.join(PROJECTS_DIR, n)).isDirectory())
    .map(id => {
      const journalPath = path.join(PROJECTS_DIR, id, `PROJECT_JOURNAL_${id}.json`);
      if (!fs.existsSync(journalPath)) return null;
      const j = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
      return { id, name: j.project_name, stages: j.stages, createdAt: j.created_at };
    })
    .filter(Boolean);
}

export async function GET() {
  try {
    return NextResponse.json(listProjects());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name = 'New Project', language = 'EN' } = await req.json();
    const execFileAsync = promisify(execFile);
    const cliPath = path.join(REPO_ROOT, 'cli', 'bin', 'babok.js');
    await execFileAsync('node', [cliPath, 'new', '--name', name, '--language', language, '--non-interactive'], { cwd: REPO_ROOT }).catch(() => null);
    const projects = listProjects();
    const newest = projects.sort((a, b) => (b?.createdAt ?? '') > (a?.createdAt ?? '') ? 1 : -1)[0];
    return NextResponse.json(newest ?? { error: 'Could not create project' }, { status: newest ? 201 : 500 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
