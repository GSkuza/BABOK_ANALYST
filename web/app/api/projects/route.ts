import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { listProjects } from '@/lib/project-store';

const REPO_ROOT = path.join(process.cwd(), '..');

export async function GET() {
  try {
    const response = NextResponse.json(listProjects());
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    return response;
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
    const newest = projects[0];
    return NextResponse.json(newest ?? { error: 'Could not create project' }, { status: newest ? 201 : 500 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
