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

export interface AiProviderModels {
  id: string;
  name: string;
  configured: boolean;
  preferred: boolean;
  defaultModel: string;
  models: string[];
  source: 'api' | 'registry' | 'fallback' | 'unconfigured';
  error: string | null;
}

export interface AiModelCatalog {
  preferredProvider: string | null;
  providers: AiProviderModels[];
  fetchedAt: string;
}

export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high';

export interface ModelTarget {
  provider: string;
  model?: string | null;
}

export interface ModelRoutingRule {
  provider?: string | null;
  model?: string | null;
  temperature?: number | null;
  effort?: EffortLevel | null;
  fallbacks?: ModelTarget[] | null;
}

export interface ModelRoutingProfile {
  default: ModelRoutingRule;
  stages: Record<string, ModelRoutingRule>;
}

export interface ModelRouting {
  version: number;
  failover_all_providers: boolean;
  default: ModelRoutingRule;
  profiles: Record<string, ModelRoutingProfile>;
}

export interface RoutingProfileSummary {
  id: string;
  name: string;
  stages: Array<{ stage: number; name: string }>;
}

export interface ModelRoutingState {
  routing: ModelRouting;
  profiles: RoutingProfileSummary[];
  effortLevels: EffortLevel[];
}

export class AiSettingsError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AiSettingsError';
    this.status = status;
  }
}

function runSettings<T = AiSettings>(payload: Record<string, unknown>, timeoutMs = 30_000) {
  return new Promise<T>((resolve, reject) => {
    const child = spawn(process.execPath, [SETTINGS_RUNNER], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => child.kill(), timeoutMs);

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
        resolve(JSON.parse(stdout) as T);
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

export function getAiModelCatalog() {
  return runSettings<AiModelCatalog>({ action: 'models' }, 45_000);
}

export function getModelRouting() {
  return runSettings<ModelRoutingState>({ action: 'routing' });
}

export function saveModelRouting(routing: unknown) {
  if (JSON.stringify(routing ?? null).length > 256_000) {
    throw new AiSettingsError('The routing configuration is too large.', 413);
  }
  return runSettings<ModelRoutingState>({ action: 'save_routing', routing });
}
