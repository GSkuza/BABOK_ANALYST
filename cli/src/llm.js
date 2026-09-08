import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import os from 'os';
import { DEFAULT_PROFILE_ID, getStage, loadProfile, resolveProfilePath } from './profiles.js';

export const LLM_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const LLM_REQUEST_OPTIONS = { timeout: LLM_REQUEST_TIMEOUT_MS, maxRetries: 0 };
const activeRequestControllers = new Set();

export class LlmRequestTimeoutError extends Error {
  constructor(message, timeoutMs) {
    super(message);
    this.name = 'LlmRequestTimeoutError';
    this.code = 'LLM_TIMEOUT';
    this.timeoutMs = timeoutMs;
  }
}

export class LlmRequestAbortError extends Error {
  constructor(message = 'LLM request cancelled.') {
    super(message);
    this.name = 'LlmRequestAbortError';
    this.code = 'LLM_ABORTED';
  }
}

function createAbortError(signal, fallbackMessage) {
  const reason = signal?.reason;
  if (reason instanceof Error) return reason;
  return new LlmRequestAbortError(typeof reason === 'string' ? reason : fallbackMessage);
}

function registerActiveRequest(controller) {
  activeRequestControllers.add(controller);
  return () => activeRequestControllers.delete(controller);
}

export function cancelActiveLlmRequests(reason = 'LLM request cancelled by user.') {
  const controllers = [...activeRequestControllers];
  for (const controller of controllers) {
    try {
      controller.abort(new LlmRequestAbortError(reason));
    } catch {
      // ignore
    }
  }
  return controllers.length;
}

function controlledStreamAbortError(label) {
  return new LlmRequestAbortError(`${label} cancelled.`);
}

async function withControlledRequest(run, options = {}) {
  const {
    timeoutMs = LLM_REQUEST_TIMEOUT_MS,
    signal,
    requestLabel = 'LLM request',
  } = options;

  const controller = new AbortController();
  const unregister = registerActiveRequest(controller);
  let timeoutId;
  let externalAbortHandler = null;

  if (signal?.aborted) {
    unregister();
    throw createAbortError(signal, `${requestLabel} cancelled.`);
  }

  const forwardAbort = () => {
    if (!controller.signal.aborted) controller.abort(createAbortError(signal, `${requestLabel} cancelled.`));
  };

  if (signal) {
    externalAbortHandler = forwardAbort;
    signal.addEventListener('abort', externalAbortHandler, { once: true });
  }

  const requestPromise = (async () => run(controller.signal))();
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) controller.abort(new LlmRequestTimeoutError(
        `${requestLabel} timed out after ${Math.round(timeoutMs / 1000)}s.`,
        timeoutMs,
      ));
      reject(controller.signal.reason);
    }, timeoutMs);
  });

  const abortPromise = new Promise((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason || controlledStreamAbortError(requestLabel)), { once: true });
  });

  try {
    return await Promise.race([requestPromise, timeoutPromise, abortPromise]);
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason || error;
    throw error;
  } finally {
    clearTimeout(timeoutId);
    unregister();
    if (signal && externalAbortHandler) signal.removeEventListener('abort', externalAbortHandler);
  }
}

function normalizeChatInvocation(arg3, arg4) {
  const options = typeof arg3 === 'function' ? { ...(arg4 || {}), onChunk: arg3 } : { ...(arg3 || {}) };
  return {
    onChunk: typeof options.onChunk === 'function' ? options.onChunk : null,
    signal: options.signal,
    timeoutMs: options.timeoutMs,
    requestLabel: options.requestLabel,
  };
}

/**
 * Return the provider-suggested delay for a rate-limit error, or null when the
 * error is unrelated to rate limiting.
 */
export function getRateLimitRetryDelayMs(error) {
  const status = error?.status ?? error?.statusCode ?? error?.response?.status;
  const message = String(error?.message || '');
  const code = String(error?.code || error?.type || error?.error?.type || '');
  if (status !== 429 && !/rate.?limit|too many requests|tpm/i.test(`${code} ${message}`)) return null;

  const headers = error?.headers || error?.response?.headers;
  const retryAfterMs = headers?.['retry-after-ms'] ?? headers?.get?.('retry-after-ms');
  const retryAfter = headers?.['retry-after'] ?? headers?.get?.('retry-after');
  const secondsInMessage = message.match(/(?:try again|retry).*?in\s+([\d.]+)\s*s/i)?.[1];
  const delayMs = retryAfterMs != null
    ? Number(retryAfterMs)
    : retryAfter != null
      ? Number(retryAfter) * 1000
      : secondsInMessage != null
        ? Number(secondsInMessage) * 1000
        : 20_000;
  return Number.isFinite(delayMs) ? Math.min(Math.max(1_000, delayMs), 120_000) : 20_000;
}

// ──────────────────────────────────────────────
//  PROVIDER REGISTRY
// ──────────────────────────────────────────────

export const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.0-flash',
    models: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ],
    keyUrl: 'https://aistudio.google.com/app/apikey',
  },
  openai: {
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.6-terra',
    models: [
      'gpt-6-astra',
      'gpt-5.6',
      'gpt-5.6-terra',
      'gpt-5.6-luna',
    ],
    keyUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic Claude',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-5',
    models: [
      'claude-fable-5-1',
      'claude-opus-5',
      'claude-sonnet-5',
      'claude-haiku-4-5',
    ],
    keyUrl: 'https://console.anthropic.com/settings/keys',
  },
  huggingface: {
    name: 'Hugging Face',
    envKey: 'HF_API_KEY',
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
    models: [
      'Qwen/Qwen2.5-72B-Instruct',
      'meta-llama/Llama-3.3-70B-Instruct',
      'deepseek-ai/DeepSeek-R1',
      'speakleash/Bielik-11B-v2',
      'speakleash/Bielik-11B-v3.0-Instruct'
    ],
    keyUrl: 'https://huggingface.co/settings/tokens',
  },
  vertex: {
    name: 'Google Vertex AI',
    envKey: 'VERTEX_PROJECT_ID',
    defaultModel: 'gemini-2.5-pro-exp-03-25',
    models: [
      'gemini-2.5-pro-exp-03-25',
      'gemini-2.0-pro-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
    ],
    keyUrl: 'https://console.cloud.google.com/apis/credentials',
    configType: 'vertex',
  },
  local: {
    name: 'Local / SGLang (OpenAI-compatible)',
    envKey: 'LOCAL_API_KEY',
    defaultModel: 'speakleash/Bielik-11B-v3.0-Instruct',
    models: ['speakleash/Bielik-11B-v3.0-Instruct', 'custom-model'],
    keyUrl: 'http://localhost:30000/v1',
  },
};

const OPENAI_MODEL_EXCLUSIONS = [
  'audio', 'realtime', 'transcribe', 'tts', 'image', 'embedding',
  'moderation', 'search', 'instruct', 'whisper', 'dall-e', 'codex',
  'cyber', 'daybreak',
];

function isOpenAITextModel(modelId) {
  const id = modelId.toLowerCase();
  const isTextFamily = id.startsWith('gpt-') || /^o\d(?:-|$)/.test(id) || id.startsWith('chatgpt-');
  return isTextFamily && !OPENAI_MODEL_EXCLUSIONS.some(part => id.includes(part));
}

/**
 * Return models available to the supplied account. OpenAI is discovered from
 * the API; other providers continue to use their registry lists.
 */
export async function discoverProviderModels(provider, apiKey, options = {}) {
  const info = PROVIDERS[provider];
  if (!info) throw new Error(`Unknown provider: ${provider}`);
  if (!['openai', 'anthropic'].includes(provider) || !apiKey) {
    return { models: [...info.models], source: 'registry', error: null };
  }

  try {
    const client = options.client || (provider === 'openai'
      ? new OpenAI({ apiKey })
      : new Anthropic({ apiKey }));
    const page = await client.models.list(provider === 'anthropic' ? { limit: 1000 } : undefined);
    const preferredOrder = new Map(info.models.map((model, index) => [model, index]));
    const models = [...new Set(page.data
      .map(model => model.id)
      .filter(model => provider === 'anthropic' ? model.startsWith('claude-') : isOpenAITextModel(model)))]
      .sort((left, right) => {
        const leftRank = preferredOrder.get(left) ?? Number.MAX_SAFE_INTEGER;
        const rightRank = preferredOrder.get(right) ?? Number.MAX_SAFE_INTEGER;
        return leftRank - rightRank || left.localeCompare(right, undefined, { numeric: true });
      });

    if (models.length === 0) throw new Error(`${info.name} API returned no compatible text models.`);
    return { models, source: 'api', error: null };
  } catch (error) {
    return { models: [...info.models], source: 'fallback', error };
  }
}

// Active provider state
let activeProvider = null;   // 'gemini' | 'openai' | 'anthropic' | 'huggingface'
let activeClient = null;
let activeModel = null;
let conversationMessages = []; // universal message buffer
let systemPromptCache = '';

// ──────────────────────────────────────────────
//  SECURE KEYSTORE  (per-provider, encrypted)
// ──────────────────────────────────────────────

const KEYSTORE_NAME = '.babok_keystore';

function deriveSecret() {
  const material = `babok::${os.hostname()}::${os.userInfo().username}::${process.cwd()}`;
  return crypto.createHash('sha256').update(material).digest();
}

function xorCipher(buf, key) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) out[i] = buf[i] ^ key[i % key.length];
  return out;
}

function getKeystorePath() {
  return path.join(process.cwd(), KEYSTORE_NAME);
}

function readKeystore() {
  const ksPath = getKeystorePath();
  if (!fs.existsSync(ksPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(ksPath, 'utf-8'));
  } catch { return {}; }
}

function writeKeystore(data) {
  data._WARNING = 'Auto-generated by BABOK CLI. Do NOT commit to git.';
  data.updated_at = new Date().toISOString();
  fs.writeFileSync(getKeystorePath(), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Read stored API key for a specific provider.
 */
export function readStoredKey(provider) {
  const ks = readKeystore();
  const entry = ks[provider];
  if (!entry?.k) return null;
  try {
    const encrypted = Buffer.from(entry.k, 'base64');
    const decrypted = xorCipher(encrypted, deriveSecret()).toString('utf-8');
    if (decrypted.length < 8) return null;
    // Vertex AI config is stored as JSON — skip alphanumeric-only check
    if (provider === 'vertex') return decrypted;
    if (/^[A-Za-z0-9_\-:.]+$/.test(decrypted)) return decrypted;
    return null;
  } catch { return null; }
}

/**
 * Store API key for a specific provider (encrypted).
 */
export function storeKey(provider, apiKey) {
  const ks = readKeystore();
  ks[provider] = {
    k: xorCipher(Buffer.from(apiKey, 'utf-8'), deriveSecret()).toString('base64'),
    stored_at: new Date().toISOString(),
  };
  writeKeystore(ks);
}

/**
 * Remove stored key for a provider (or all).
 */
export function clearStoredKey(provider) {
  if (!provider) {
    const ksPath = getKeystorePath();
    if (fs.existsSync(ksPath)) fs.unlinkSync(ksPath);
    return;
  }
  const ks = readKeystore();
  delete ks[provider];
  writeKeystore(ks);
}

/**
 * List providers that have stored keys.
 */
export function listStoredProviders() {
  const ks = readKeystore();
  return Object.keys(PROVIDERS).filter(p => ks[p]?.k);
}

// ──────────────────────────────────────────────
//  API KEY RESOLUTION  (env → .env → keystore)
// ──────────────────────────────────────────────

/**
 * Get API key for a provider without prompting.
 */
export function getApiKey(provider) {
  const info = PROVIDERS[provider];
  if (!info) return null;

  // Vertex AI: compose config from env vars instead of a single API key
  if (provider === 'vertex') {
    const projectId = process.env.VERTEX_PROJECT_ID;
    if (projectId) {
      const cfg = {
        project_id: projectId,
        location: process.env.VERTEX_LOCATION || 'us-central1',
      };
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        cfg.credentials_file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      }
      return JSON.stringify(cfg);
    }
    return readStoredKey('vertex');
  }

  // 1. Environment variable
  if (process.env[info.envKey]) return process.env[info.envKey];

  // 2. .env file (gitignored)
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(new RegExp(`^${info.envKey}\\s*=\\s*(.+)$`, 'm'));
    if (match?.[1]?.trim()) return match[1].trim().replace(/^["']|["']$/g, '');
  }

  // 3. Encrypted keystore
  return readStoredKey(provider);
}

/**
 * Interactively select provider, model and enter API key.
 * Returns { provider, apiKey, model }
 */
export async function promptForProvider() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(resolve => rl.question(q, a => resolve(a.trim())));

  try {
    const stored = listStoredProviders();
    const providerList = Object.entries(PROVIDERS);

    // ── Krok 1: Wybor dostawcy ──
    process.stdout.write('\n');
    process.stdout.write('  Wybierz dostawce AI:\n\n');
    providerList.forEach(([key, info], i) => {
      const badge = stored.includes(key) ? chalk_green('  [klucz zapisany]') : '';
      process.stdout.write(`    ${i + 1}. ${info.name}${badge}\n`);
    });
    process.stdout.write('\n');

    const provNum = await ask(`  Numer dostawcy (1-${providerList.length}): `);
    const provIdx = parseInt(provNum) - 1;
    if (isNaN(provIdx) || provIdx < 0 || provIdx >= providerList.length) {
      throw new Error('Nieprawidlowy numer dostawcy.');
    }
    const [providerKey, info] = providerList[provIdx];

    // ── Krok 2: Klucz API ──
    let apiKey = getApiKey(providerKey);
    if (apiKey) {
      const ans = await ask(`  Uzyc zapisanego klucza ${info.name}? (T/n): `);
      if (ans.toLowerCase().startsWith('n')) {
        apiKey = await _askForKeyAsync(ask, providerKey, info);
      }
    } else {
      apiKey = await _askForKeyAsync(ask, providerKey, info);
    }

    // ── Krok 3: Wybor modelu ──
    const discovery = await discoverProviderModels(providerKey, apiKey);
    const availableModels = discovery.models;
    process.stdout.write('\n');
    process.stdout.write(`  Modele ${info.name}:\n\n`);
    if (discovery.source === 'api') {
      process.stdout.write('  Modele dostepne dla podanego klucza API:\n\n');
    } else if (discovery.error) {
      process.stdout.write(`  Nie udalo sie pobrac listy z API (${discovery.error.message}). Uzywam listy awaryjnej.\n\n`);
    }
    availableModels.forEach((m, i) => {
      const def = m === info.defaultModel ? chalk_green('  <domyslny>') : '';
      process.stdout.write(`    ${i + 1}. ${m}${def}\n`);
    });
    process.stdout.write('\n');

    const defaultModelIdx = Math.max(0, availableModels.indexOf(info.defaultModel));
    const modelNum = await ask(`  Numer modelu [${defaultModelIdx + 1}]: `);
    const requestedModelIdx = modelNum === '' ? defaultModelIdx : parseInt(modelNum) - 1;
    const modelIdx = requestedModelIdx >= 0 && requestedModelIdx < availableModels.length
      ? requestedModelIdx
      : defaultModelIdx;
    const selectedModel = availableModels[modelIdx];

    rl.close();
    return { provider: providerKey, apiKey, model: selectedModel };

  } catch (err) {
    rl.close();
    throw err;
  }
}

async function _askForKeyAsync(ask, providerKey, info) {
  if (providerKey === 'vertex') {
    return _collectVertexConfig(ask);
  }

  process.stdout.write('\n');
  process.stdout.write(`  Klucz API wymagany dla: ${info.name}\n`);
  process.stdout.write(`  Pobierz na: ${info.keyUrl}\n\n`);
  process.stdout.write('  Klucz jest przechowywany tylko lokalnie (zaszyfrowany, gitignored).\n\n');

  const key = await ask('  Podaj klucz API: ');
  if (!key) throw new Error('Nie podano klucza API.');

  const saveAns = await ask('  Zapisac na przyszlosc? (T/n): ');
  if (!saveAns.toLowerCase().startsWith('n')) {
    storeKey(providerKey, key);
    process.stdout.write('  Klucz zapisany (.babok_keystore, zaszyfrowany, gitignored)\n\n');
  } else {
    process.stdout.write('  Klucz uzywany tylko w tej sesji (nie zapisano)\n\n');
  }
  return key;
}

async function _collectVertexConfig(ask) {
  process.stdout.write('\n');
  process.stdout.write('  Konfiguracja Google Vertex AI\n');
  process.stdout.write('  ─────────────────────────────────────────────────────\n');
  process.stdout.write('  Wymagane: Google Cloud Project ID\n');
  process.stdout.write('  Uwierzytelnianie: Service Account JSON  lub  ADC\n');
  process.stdout.write('  ADC: uruchom "gcloud auth application-default login"\n\n');

  const projectId = await ask('  Google Cloud Project ID: ');
  if (!projectId) throw new Error('Project ID jest wymagany dla Vertex AI.');

  const locRaw = await ask('  Region [us-central1]: ');
  const location = locRaw || 'us-central1';

  process.stdout.write('\n');
  process.stdout.write('  Sciezka do pliku klucza Service Account JSON\n');
  process.stdout.write('  (Enter = uzyj ADC, np. po "gcloud auth application-default login")\n\n');
  const credFile = await ask('  Plik klucza SA (opcjonalnie): ');

  const config = { project_id: projectId, location };
  if (credFile) config.credentials_file = credFile;
  const configStr = JSON.stringify(config);

  const saveAns = await ask('  Zapisac konfiguracje na przyszlosc? (T/n): ');
  if (!saveAns.toLowerCase().startsWith('n')) {
    storeKey('vertex', configStr);
    process.stdout.write('  Konfiguracja zapisana (.babok_keystore, gitignored)\n\n');
  } else {
    process.stdout.write('  Konfiguracja uzywana tylko w tej sesji (nie zapisano)\n\n');
  }
  return configStr;
}

// Legacy callback-based helper — used only by promptForKeyOnly()
function askForKey(rl, providerKey, info, resolve, reject) {
  process.stdout.write('\n');
  process.stdout.write(`  Klucz API wymagany dla: ${info.name}\n`);
  process.stdout.write(`  Pobierz na: ${info.keyUrl}\n\n`);
  process.stdout.write('  Klucz jest przechowywany tylko lokalnie (zaszyfrowany, gitignored).\n\n');

  rl.question('  Podaj klucz API: ', (apiKey) => {
    const key = apiKey.trim();
    if (!key) { rl.close(); reject(new Error('Nie podano klucza API.')); return; }

    rl.question('  Zapisac na przyszlosc? (T/n): ', (ans) => {
      rl.close();
      if (!ans.trim() || !ans.trim().toLowerCase().startsWith('n')) {
        storeKey(providerKey, key);
        process.stdout.write('  Klucz zapisany (.babok_keystore, zaszyfrowany, gitignored)\n\n');
      } else {
        process.stdout.write('  Klucz uzywany tylko w tej sesji (nie zapisano)\n\n');
      }
      resolve({ provider: providerKey, apiKey: key });
    });
  });
}

/**
 * Interactively ask for an API key for a specific provider.
 */
export function promptForKeyOnly(providerKey, rl) {
  const info = PROVIDERS[providerKey];
  return new Promise((resolve, reject) => {
    askForKey(rl, providerKey, info, resolve, reject);
  });
}

// simple green text without chalk dependency in this module
function chalk_green(s) { return `\x1b[32m${s}\x1b[0m`; }

// ──────────────────────────────────────────────
//  UNIFIED CLIENT INIT & CHAT
// ──────────────────────────────────────────────

/**
 * Initialize the selected provider.
 */
export async function initializeProvider(provider, apiKey, modelName) {
  const info = PROVIDERS[provider];
  if (!info) throw new Error(`Unknown provider: ${provider}`);
  const model = modelName || info.defaultModel;

  switch (provider) {
    case 'gemini': {
      const genAI = new GoogleGenerativeAI(apiKey);
      activeClient = genAI.getGenerativeModel({ model });
      break;
    }
    case 'vertex': {
      const { VertexAI } = await import('@google-cloud/vertexai');
      let cfg = {};
      try { cfg = JSON.parse(apiKey); } catch { cfg = { project_id: apiKey }; }
      const vertexOptions = {
        project: cfg.project_id,
        location: cfg.location || 'us-central1',
      };
      if (cfg.credentials_file) {
        vertexOptions.googleAuthOptions = { keyFilename: cfg.credentials_file };
      }
      const vertexAI = new VertexAI(vertexOptions);
      activeClient = vertexAI.getGenerativeModel({ model });
      break;
    }
    case 'openai': {
      activeClient = new OpenAI({ apiKey });
      break;
    }
    case 'local': {
      // For local servers like SGLang, Ollama (OpenAI API), vLLM
      // We check if modelName is actually a URL, or use a default local URL
      const baseURL = modelName?.startsWith('http') ? modelName : 'http://localhost:30000/v1';
      activeClient = new OpenAI({
        apiKey: apiKey || 'not-needed',
        baseURL: baseURL
      });
      activeProvider = 'local';
      activeModel = modelName || info.defaultModel;
      return;
    }
    case 'anthropic': {
      activeClient = new Anthropic({ apiKey, maxRetries: 0 });
      break;
    }
    case 'huggingface': {
      activeClient = new HfInference(apiKey);
      break;
    }
  }

  activeProvider = provider;
  activeModel = model;
}

export async function createOpenAITextResponse(client, model, messages) {
  return withControlledRequest(async () => {
    const response = await client.responses.create({
      model,
      input: messages,
      max_output_tokens: 8192,
    }, LLM_REQUEST_OPTIONS);
    return response.output_text || '';
  }, { requestLabel: `OpenAI ${model} request` });
}

export async function streamOpenAITextResponse(client, model, messages, onChunk, options = {}) {
  return withControlledRequest(async (signal) => {
    const stream = await client.responses.create({
      model,
      input: messages,
      max_output_tokens: 8192,
      stream: true,
    }, { ...LLM_REQUEST_OPTIONS, signal });
    let fullResponse = '';
    for await (const event of stream) {
      if (signal.aborted) throw createAbortError(signal, `OpenAI ${model} stream cancelled.`);
      if (event.type === 'error' || event.type === 'response.failed') {
        throw new Error(event.message || event.response?.error?.message || 'LLM response failed');
      }
      if (event.type === 'response.incomplete') {
        throw new Error(`LLM response incomplete: ${event.response?.incomplete_details?.reason || 'unknown reason'}`);
      }
      if (event.type !== 'response.output_text.delta' || !event.delta) continue;
      fullResponse += event.delta;
      if (onChunk) onChunk(event.delta);
    }
    return fullResponse;
  }, { ...options, requestLabel: options.requestLabel || `OpenAI ${model} stream` });
}

export async function createAnthropicTextResponse(client, model, systemPrompt, messages, options = {}) {
  return withControlledRequest(async () => {
    const response = await client.messages.create({
      model,
      system: systemPrompt,
      messages,
      max_tokens: 8192,
    });
    return response.content?.find(block => block.type === 'text')?.text || '';
  }, { ...options, requestLabel: options.requestLabel || `Anthropic ${model} request` });
}

export async function streamAnthropicTextResponse(client, model, systemPrompt, messages, onChunk, options = {}) {
  return withControlledRequest(async (signal) => {
    const stream = client.messages.stream({
      model,
      system: systemPrompt,
      messages,
      max_tokens: 8192,
    });
    let fullResponse = '';
    for await (const event of stream) {
      if (signal.aborted) throw createAbortError(signal, `Anthropic ${model} stream cancelled.`);
      if (event.type !== 'content_block_delta' || !event.delta?.text) continue;
      fullResponse += event.delta.text;
      if (onChunk) onChunk(event.delta.text);
    }
    return fullResponse;
  }, { ...options, requestLabel: options.requestLabel || `Anthropic ${model} stream` });
}

/**
 * Create a stateless, reusable LLM client without touching global state.
 * Each chat() call is a single-turn request; onChunk enables live progress.
 * Use in the orchestrator pipeline for per-stage model routing.
 *
 * @param {string} provider
 * @param {string} apiKey
 * @param {string} [modelName]
 * @returns {{ chat: (systemPrompt: string, userMessage: string) => Promise<string>, providerName: string, modelName: string }}
 */
export function createLlmClient(provider, apiKey, modelName) {
  const info = PROVIDERS[provider];
  if (!info) throw new Error(`createLlmClient: unknown provider "${provider}"`);
  const model = modelName || info.defaultModel;
  // Reuse the SDK instance across drafts, judges and revisions.
  let sdkClient;

  const chat = async (systemPrompt, userMessage, arg3, arg4) => {
    const { onChunk, signal, timeoutMs, requestLabel } = normalizeChatInvocation(arg3, arg4);
    const requestOptions = { signal, timeoutMs, requestLabel: requestLabel || `${info.name} ${model}` };
    switch (provider) {
      case 'gemini': {
        return withControlledRequest(async (requestSignal) => {
          const genAI = sdkClient ??= new GoogleGenerativeAI(apiKey);
          const genModel = genAI.getGenerativeModel({
            model,
            systemInstruction: systemPrompt,
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          });
          if (onChunk) {
            const result = await genModel.generateContentStream(userMessage);
            let text = '';
            for await (const chunk of result.stream) {
              if (requestSignal.aborted) throw createAbortError(requestSignal, `Gemini ${model} stream cancelled.`);
              const delta = chunk.text();
              text += delta;
              onChunk(delta);
            }
            return text;
          }
          const result = await genModel.generateContent(userMessage);
          if (requestSignal.aborted) throw createAbortError(requestSignal, `Gemini ${model} request cancelled.`);
          return result.response.text();
        }, requestOptions);
      }
      case 'vertex': {
        return withControlledRequest(async (requestSignal) => {
          const { VertexAI } = await import('@google-cloud/vertexai');
          let cfg = {};
          try { cfg = JSON.parse(apiKey); } catch { cfg = { project_id: apiKey }; }
          const vertexOptions = {
            project: cfg.project_id,
            location: cfg.location || 'us-central1',
          };
          if (cfg.credentials_file) {
            vertexOptions.googleAuthOptions = { keyFilename: cfg.credentials_file };
          }
          const vertexAI = new VertexAI(vertexOptions);
          const genModel = vertexAI.getGenerativeModel({ model });
          if (onChunk) {
            const result = await genModel.generateContentStream({
              contents: [{ role: 'user', parts: [{ text: userMessage }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
            });
            let text = '';
            for await (const chunk of result.stream) {
              if (requestSignal.aborted) throw createAbortError(requestSignal, `Vertex ${model} stream cancelled.`);
              const delta = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
              text += delta;
              if (delta) onChunk(delta);
            }
            return text;
          }
          const result = await genModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
          });
          if (requestSignal.aborted) throw createAbortError(requestSignal, `Vertex ${model} request cancelled.`);
          return result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }, requestOptions);
      }
      case 'openai':
      case 'local': {
        const baseURL = provider === 'local'
          ? (model?.startsWith('http') ? model : 'http://localhost:30000/v1')
          : undefined;
        const client = sdkClient ??= new OpenAI({ apiKey: apiKey || 'not-needed', maxRetries: 0, ...(baseURL ? { baseURL } : {}) });
        const selectedModel = provider === 'local' ? info.defaultModel : model;
        if (provider === 'openai') {
          return streamOpenAITextResponse(client, selectedModel, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ], onChunk, requestOptions);
        }
        return withControlledRequest(async (requestSignal) => {
          const resp = await client.chat.completions.create({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 8192,
            temperature: 0.7,
          }, { ...LLM_REQUEST_OPTIONS, signal: requestSignal });
          return resp.choices?.[0]?.message?.content || '';
        }, { ...requestOptions, requestLabel: requestLabel || `Local ${selectedModel} request` });
      }
      case 'anthropic': {
        const client = sdkClient ??= new Anthropic({ apiKey, maxRetries: 0 });
        if (onChunk) {
          return streamAnthropicTextResponse(client, model, systemPrompt,
            [{ role: 'user', content: userMessage }], onChunk, requestOptions);
        }
        return createAnthropicTextResponse(
          client,
          model,
          systemPrompt,
          [{ role: 'user', content: userMessage }],
          requestOptions,
        );
      }
      case 'huggingface': {
        return withControlledRequest(async (requestSignal) => {
          const hf = sdkClient ??= new HfInference(apiKey);
          const resp = await hf.chatCompletion({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            max_tokens: 8192,
          });
          if (requestSignal.aborted) throw createAbortError(requestSignal, `Hugging Face ${model} request cancelled.`);
          return resp.choices?.[0]?.message?.content || '';
        }, requestOptions);
      }
      default:
        throw new Error(`createLlmClient: unsupported provider "${provider}"`);
    }
  };

  return { chat, providerName: info.name, modelName: model };
}

/**
 * Start chat session (sets system prompt, optionally loads history).
 */
export function startChatSession(systemPrompt, history = []) {
  systemPromptCache = systemPrompt;
  conversationMessages = [...history];
}

/**
 * Clear current conversation history in memory.
 */
export function clearChatHistory() {
  conversationMessages = [];
}

/**
 * Send message and stream response (provider-agnostic).
 */
export async function sendMessageStream(message, onChunk, options = {}) {
  conversationMessages.push({ role: 'user', parts: [{ text: message }] });

  try {
    const fullResponse = await withControlledRequest(async (signal) => {
      let responseText = '';

      switch (activeProvider) {
        case 'gemini': {
          const chat = activeClient.startChat({
            history: conversationMessages.slice(0, -1),
            systemInstruction: { parts: [{ text: systemPromptCache }] },
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          });
          const result = await chat.sendMessageStream(message);
          for await (const chunk of result.stream) {
            if (signal.aborted) throw createAbortError(signal, `Gemini ${activeModel} stream cancelled.`);
            const text = chunk.text();
            responseText += text;
            if (onChunk) onChunk(text);
          }
          break;
        }

        case 'vertex': {
          const chat = activeClient.startChat({
            history: conversationMessages.slice(0, -1).map(m => ({
              role: m.role === 'model' ? 'model' : 'user',
              parts: m.parts,
            })),
            systemInstruction: { parts: [{ text: systemPromptCache }] },
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
          });
          const result = await chat.sendMessageStream(message);
          for await (const chunk of result.stream) {
            if (signal.aborted) throw createAbortError(signal, `Vertex ${activeModel} stream cancelled.`);
            const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
            responseText += text;
            if (onChunk && text) onChunk(text);
          }
          break;
        }

        case 'openai':
        case 'local': {
          const selectedModel = activeProvider === 'local' && activeModel?.startsWith('http')
            ? PROVIDERS.local.defaultModel
            : activeModel;
          const messages = [
            { role: 'system', content: systemPromptCache },
            ...conversationMessages.map(m => ({
              role: m.role === 'model' ? 'assistant' : m.role,
              content: m.parts[0].text,
            })),
          ];
          responseText = await streamOpenAITextResponse(activeClient, selectedModel, messages, onChunk, {
            signal,
            timeoutMs: options.timeoutMs,
            requestLabel: options.requestLabel || `${PROVIDERS[activeProvider]?.name || activeProvider} ${selectedModel} chat`,
          });
          break;
        }

        case 'anthropic': {
          const messages = conversationMessages.map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.parts[0].text,
          }));
          responseText = await streamAnthropicTextResponse(
            activeClient,
            activeModel,
            systemPromptCache,
            messages,
            onChunk,
            {
              signal,
              timeoutMs: options.timeoutMs,
              requestLabel: options.requestLabel || `Anthropic ${activeModel} chat`,
            },
          );
          break;
        }

        case 'huggingface': {
          const messages = [
            { role: 'system', content: systemPromptCache },
            ...conversationMessages.map(m => ({
              role: m.role === 'model' ? 'assistant' : m.role,
              content: m.parts[0].text,
            })),
          ];
          const isEndpoint = activeModel.startsWith('http') || activeModel.includes('.endpoints.huggingface.cloud');
          const streamOptions = {
            messages,
            max_tokens: 8192,
            temperature: 0.7,
            provider: 'auto',
          };
          if (!isEndpoint) {
            streamOptions.model = activeModel;
          }

          const client = isEndpoint ? activeClient.endpoint(activeModel) : activeClient;
          const stream = client.chatCompletionStream(streamOptions);

          for await (const chunk of stream) {
            if (signal.aborted) throw createAbortError(signal, `Hugging Face ${activeModel} stream cancelled.`);
            const text = chunk.choices?.[0]?.delta?.content || '';
            responseText += text;
            if (onChunk && text) onChunk(text);
          }
          break;
        }

        default:
          throw new Error(`Provider ${activeProvider} not initialized`);
      }

      return responseText;
    }, {
      signal: options.signal,
      timeoutMs: options.timeoutMs,
      requestLabel: options.requestLabel || `${PROVIDERS[activeProvider]?.name || activeProvider} ${activeModel} chat`,
    });

    conversationMessages.push({ role: 'model', parts: [{ text: fullResponse }] });
    return fullResponse;
  } catch (error) {
    conversationMessages.pop();
    throw error;
  }
}

/**
 * Get active provider info for display.
 */
export function getActiveProviderInfo() {
  return {
    provider: activeProvider,
    model: activeModel,
    name: PROVIDERS[activeProvider]?.name || activeProvider,
  };
}

// ──────────────────────────────────────────────
//  PROMPT LOADING
// ──────────────────────────────────────────────

export function loadStagePrompt(stageNumber, profile = loadProfile(DEFAULT_PROFILE_ID)) {
  const stage = getStage(profile, stageNumber);
  const possiblePaths = [];
  if (stage) possiblePaths.push(path.join(resolveProfilePath(profile, 'stages_dir'), stage.prompt_file));
  possiblePaths.push(resolveProfilePath(profile, 'system_prompt'));
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  return getGenericStagePrompt(stageNumber, profile);
}

export function loadMainSystemPrompt(profile = loadProfile(DEFAULT_PROFILE_ID)) {
  const possiblePaths = [
    resolveProfilePath(profile, 'system_prompt'),
    path.join(process.cwd(), 'BABOK_AGENT_SYSTEM_PROMPT.md'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8');
  }
  return '';
}

function getGenericStagePrompt(stageNumber, profile) {
  const stageName = getStage(profile, stageNumber)?.name ?? `Stage ${stageNumber}`;
  return `You are the ${profile.name} Agent, an expert Business Analyst.
${profile.description ?? ''}

Currently working on: Stage ${stageNumber} - ${stageName}

Guidelines:
- Ask clarifying questions when needed
- Provide evidence-based analysis
- Wait for human validation before proceeding to deliverables
- Use Polish language for responses when user writes in Polish
- Follow BABOK v3 methodology`;
}
