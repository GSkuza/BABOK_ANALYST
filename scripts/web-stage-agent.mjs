#!/usr/bin/env node

import {
  createLlmClient,
  getApiKey,
  getPreferredProvider,
  PROVIDERS,
} from '../cli/src/llm.js';

async function readInput() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

try {
  const { systemPrompt, userPrompt, provider: requestedProvider } = await readInput();
  const availableProviders = Object.keys(PROVIDERS).filter((provider) => getApiKey(provider));
  const preferredProvider = getPreferredProvider();
  const provider = requestedProvider
    || (preferredProvider && availableProviders.includes(preferredProvider) ? preferredProvider : availableProviders[0]);
  if (!provider || !availableProviders.includes(provider) || !PROVIDERS[provider]) {
    throw new Error('No configured LLM provider is available. Open AI Settings in the Web GUI and configure an API key first.');
  }
  const apiKey = getApiKey(provider);
  if (!apiKey) throw new Error(`No API key is configured for ${provider}.`);

  const info = PROVIDERS[provider];
  const client = createLlmClient(provider, apiKey, info.defaultModel);
  const text = await client.chat(systemPrompt, userPrompt, {
    requestLabel: `Web stage interview (${info.name})`,
  });
  process.stdout.write(JSON.stringify({ text, provider: info.name }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
