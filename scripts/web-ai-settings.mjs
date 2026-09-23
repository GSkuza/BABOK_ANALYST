#!/usr/bin/env node

import {
  clearStoredKey,
  discoverProviderModels,
  EFFORT_LEVELS,
  getApiKey,
  getPreferredProvider,
  listStoredProviders,
  PROVIDERS,
  setPreferredProvider,
  storeKey,
} from '../cli/src/llm.js';
import { readModelRouting, writeModelRouting } from '../cli/src/model-routing.js';
import { listProfileIds, loadProfile } from '../cli/src/profiles.js';

const DISCOVERY_TIMEOUT_MS = 10_000;

async function readInput() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input || '{}');
}

function settings() {
  const preferredProvider = getPreferredProvider();
  const storedProviders = listStoredProviders();
  return {
    preferredProvider,
    providers: Object.entries(PROVIDERS).map(([id, provider]) => ({
      id,
      name: provider.name,
      configured: Boolean(getApiKey(id)),
      stored: storedProviders.includes(id),
      preferred: preferredProvider === id,
      keyUrl: provider.keyUrl,
      configType: provider.configType ?? 'api_key',
    })),
  };
}

async function modelCatalog() {
  const preferredProvider = getPreferredProvider();
  const providers = await Promise.all(Object.entries(PROVIDERS).map(async ([id, provider]) => {
    const apiKey = getApiKey(id);
    const base = {
      id,
      name: provider.name,
      configured: Boolean(apiKey),
      preferred: preferredProvider === id,
      defaultModel: provider.defaultModel,
    };
    if (!apiKey) return { ...base, models: [], source: 'unconfigured', error: null };
    const discovery = await discoverProviderModels(id, apiKey, { timeoutMs: DISCOVERY_TIMEOUT_MS });
    return {
      ...base,
      models: discovery.models,
      source: discovery.source,
      error: discovery.error ? String(discovery.error.message || discovery.error).slice(0, 300) : null,
    };
  }));
  return { preferredProvider, providers, fetchedAt: new Date().toISOString() };
}

function profileSummaries() {
  return listProfileIds().map((id) => {
    const profile = loadProfile(id);
    return {
      id,
      name: profile.name || id,
      stages: profile.stages.map((stage) => ({ stage: stage.stage, name: stage.name })),
    };
  });
}

function routingState() {
  return {
    routing: readModelRouting(),
    profiles: profileSummaries(),
    effortLevels: EFFORT_LEVELS,
  };
}

try {
  const input = await readInput();
  let output;
  if (input.action === 'save') {
    if (!PROVIDERS[input.provider]) throw new Error('Unknown AI provider.');
    if (typeof input.secret !== 'string' || input.secret.trim().length < 8) {
      throw new Error('The API key or provider configuration must contain at least 8 characters.');
    }
    storeKey(input.provider, input.secret.trim());
    if (input.preferred !== false) setPreferredProvider(input.provider);
    output = settings();
  } else if (input.action === 'prefer') {
    if (!PROVIDERS[input.provider] || !getApiKey(input.provider)) {
      throw new Error('Configure this provider before selecting it.');
    }
    setPreferredProvider(input.provider);
    output = settings();
  } else if (input.action === 'clear') {
    if (!PROVIDERS[input.provider]) throw new Error('Unknown AI provider.');
    clearStoredKey(input.provider);
    output = settings();
  } else if (input.action === 'status') {
    output = settings();
  } else if (input.action === 'models') {
    output = await modelCatalog();
  } else if (input.action === 'routing') {
    output = routingState();
  } else if (input.action === 'save_routing') {
    writeModelRouting(input.routing);
    output = routingState();
  } else {
    throw new Error('Unsupported settings action.');
  }

  process.stdout.write(JSON.stringify(output));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
