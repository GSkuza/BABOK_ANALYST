#!/usr/bin/env node

import {
  getApiKey,
  PROVIDERS,
} from '../cli/src/llm.js';
import { createRoutedLlmClient, isNonFailoverError, listConfiguredProviders, resolveConfiguredRoute } from '../cli/src/routed-llm.js';

async function readInput() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

try {
  const {
    systemPrompt,
    userPrompt,
    provider: requestedProvider,
    profile,
    stage,
  } = await readInput();
  const availableProviders = listConfiguredProviders();
  if (requestedProvider && !availableProviders.includes(requestedProvider)) {
    throw new Error(`No API key is configured for ${requestedProvider}.`);
  }

  const route = resolveConfiguredRoute({
    profile,
    stage: Number.isInteger(stage) ? stage : null,
    availableProviders,
  });
  const candidates = requestedProvider
    ? [
      { provider: requestedProvider, model: PROVIDERS[requestedProvider].defaultModel, source: 'request' },
      ...route.candidates.filter((candidate) => candidate.provider !== requestedProvider),
    ]
    : route.candidates;
  if (candidates.length === 0) {
    throw new Error('No configured LLM provider is available. Open AI Settings in the Web GUI and configure an API key first.');
  }

  const client = createRoutedLlmClient({ ...route, candidates }, { getKey: getApiKey });
  let text;
  try {
    text = await client.chat(systemPrompt, userPrompt, {
      requestLabel: `Web stage interview (${client.providerName} ${client.modelName})`,
    });
  } catch (error) {
    if (!client.failovers.length || isNonFailoverError(error)) throw error;
    const detail = [...client.failovers, { provider: client.providerId, model: client.modelName, error: error.message }]
      .map((failure) => `${failure.provider}/${failure.model}: ${failure.error}`).join(' | ');
    throw new Error(`All routed AI models failed. ${detail}`);
  }
  if (!text?.trim()) throw new Error('The model returned an empty response.');
  const active = client.active;
  process.stdout.write(JSON.stringify({
    text,
    provider: `${client.providerName} · ${active.model}`,
    providerId: active.provider,
    model: active.model,
    temperature: client.generation.temperature,
    effort: client.generation.effort,
    routeSource: active.source,
    failovers: client.failovers,
  }));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
