import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import { promisify } from 'util';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const execFileAsync = promisify(execFile);

export class StageActionError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'StageActionError';
    this.status = status;
  }
}

export async function runStageAction(
  projectId: string,
  stageNum: number,
  action: 'approve' | 'reject',
  reason?: string,
  execFileImpl = execFileAsync,
) {
  const cliPath = path.join(REPO_ROOT, 'cli', 'bin', 'babok.js');

  try {
    if (action === 'approve') {
      await execFileImpl('node', [cliPath, 'approve', projectId, String(stageNum), '--attestor', 'Web UI'], { cwd: REPO_ROOT });
      return;
    }

    await execFileImpl('node', [cliPath, 'reject', projectId, String(stageNum), '--reason', reason ?? 'Rejected via Web UI'], { cwd: REPO_ROOT });
  } catch (err) {
    const stderr = err && typeof err === 'object' && 'stderr' in err ? String(err.stderr || '') : '';
    const lines = stderr.trim().split(/\r?\n/).filter(Boolean);
    const message = (lines.find((line) => /^Error:/i.test(line)) || lines.at(-1) || (err instanceof Error ? err.message : 'Stage update failed'))
      .replace(/^Error:\s*/, '');
    const userMessage = /no deliverable file/i.test(message)
      ? 'Generate and save the stage deliverable before approval.'
      : message;
    const status = /already approved/i.test(userMessage) ? 409 : 400;
    throw new StageActionError(userMessage, status);
  }
}
