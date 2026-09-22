import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SETTINGS_RUNNER = path.join(REPO_ROOT, 'scripts', 'web-ai-settings.mjs');
const MAX_RUNNER_OUTPUT = 1024 * 1024;

export interface AiProviderSetting {
  id: string;
  name: string;
  configured: boolean;
  stored: boolean;
  preferred: boolean;
  keyUrl: string;
  configType: 'api_key' | 'vertex';
}

export interface AiSettings {
  preferredProvider: string | null;
  providers: AiProviderSetting[];
}

export class AiSettingsError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AiSettingsError';
    this.status = status;
  }
}

function runSettings(payload: Record<string, unknown>) {
  return new Promise<AiSettings>((resolve, reject) => {
    const child = spawn(process.execPath, [SETTINGS_RUNNER], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill(), 30_000);

    child.stdout.setEncoding('utf-8');
    child.stderr.setEncoding('utf-8');
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout, 'utf-8') > MAX_RUNNER_OUTPUT) child.kill();
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
      if (Buffer.byteLength(stderr, 'utf-8') > MAX_RUNNER_OUTPUT) child.kill();
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(new AiSettingsError(error.message, 500));
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new AiSettingsError(stderr.trim() || 'Unable to update AI settings.'));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as AiSettings);
      } catch {
        reject(new AiSettingsError('AI settings returned an invalid response.', 500));
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

export function getAiSettings() {
  return runSettings({ action: 'status' });
}

export function saveAiProvider(provider: string, secret: string) {
  if (secret.length > 65_536) {
    throw new AiSettingsError('The API key or provider configuration is too large.', 413);
  }
  return runSettings({ action: 'save', provider, secret, preferred: true });
}

export function preferAiProvider(provider: string) {
  return runSettings({ action: 'prefer', provider });
}

export function clearAiProvider(provider: string) {
  return runSettings({ action: 'clear', provider });
}
