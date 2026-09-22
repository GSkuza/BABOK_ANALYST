#!/usr/bin/env node

import {
  clearStoredKey,
  getApiKey,
  getPreferredProvider,
  listStoredProviders,
  PROVIDERS,
  setPreferredProvider,
  storeKey,
} from '../cli/src/llm.js';

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

try {
  const input = await readInput();
  if (input.action === 'save') {
    if (!PROVIDERS[input.provider]) throw new Error('Unknown AI provider.');
    if (typeof input.secret !== 'string' || input.secret.trim().length < 8) {
      throw new Error('The API key or provider configuration must contain at least 8 characters.');
    }
    storeKey(input.provider, input.secret.trim());
    if (input.preferred !== false) setPreferredProvider(input.provider);
  } else if (input.action === 'prefer') {
    if (!PROVIDERS[input.provider] || !getApiKey(input.provider)) {
      throw new Error('Configure this provider before selecting it.');
    }
    setPreferredProvider(input.provider);
  } else if (input.action === 'clear') {
    if (!PROVIDERS[input.provider]) throw new Error('Unknown AI provider.');
    clearStoredKey(input.provider);
  } else if (input.action !== 'status') {
    throw new Error('Unsupported settings action.');
  }

  process.stdout.write(JSON.stringify(settings()));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
