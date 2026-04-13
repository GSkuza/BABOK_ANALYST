import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectDir = path.join(PROJECTS_DIR, id);
  if (!fs.existsSync(projectDir)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const execFileAsync = promisify(execFile);
    const zipName = `${id}.zip`;
    const zipPath = path.join(projectDir, zipName);
    await execFileAsync('zip', ['-r', zipName, '.', '--exclude', zipName], { cwd: projectDir });
    const data = fs.readFileSync(zipPath);
    fs.unlinkSync(zipPath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${id}.zip"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
