import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { isValidProjectId } from '@/lib/project-store';

const REPO_ROOT = path.join(process.cwd(), '..');
const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');
const execFileAsync = promisify(execFile);

function psQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function createZipArchive(projectDir: string, zipPath: string) {
  if (process.platform === 'win32') {
    const archiveSource = path.join(projectDir, '*');
    const command = `$source = ${psQuote(archiveSource)}; $destination = ${psQuote(zipPath)}; Compress-Archive -Path $source -DestinationPath $destination -Force`;
    await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        command,
      ],
      { windowsHide: true }
    );
    return;
  }

  await execFileAsync('zip', ['-r', zipPath, '.'], { cwd: projectDir });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidProjectId(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  const projectDir = path.join(PROJECTS_DIR, id);
  if (!fs.existsSync(projectDir)) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const zipPath = path.join(os.tmpdir(), `${id}-${Date.now()}.zip`);

  try {
    await createZipArchive(projectDir, zipPath);
    const data = fs.readFileSync(zipPath);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${id}.zip"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  } finally {
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}
