#!/usr/bin/env node

import {
  createLlmClient,
  getApiKey,
  getPreferredProvider,
  LlmRequestAbortError,
  LlmRequestTimeoutError,
  PROVIDERS,
} from '../cli/src/llm.js';
import { readModelRouting, resolveModelRoute } from '../cli/src/model-routing.js';

async function readInput() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

function describeError(error) {
  return String(error instanceof Error ? error.message : error).replace(/\s+/g, ' ').slice(0, 300);
}

try {
  const {
    systemPrompt,
    userPrompt,
    provider: requestedProvider,
    profile,
    stage,
  } = await readInput();
  const availableProviders = Object.keys(PROVIDERS).filter((provider) => getApiKey(provider));
  if (requestedProvider && !availableProviders.includes(requestedProvider)) {
    throw new Error(`No API key is configured for ${requestedProvider}.`);
  }

  const route = resolveModelRoute(readModelRouting(), {
    profile,
    stage: Number.isInteger(stage) ? stage : null,
    availableProviders,
    preferredProvider: getPreferredProvider(),
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

  const failures = [];
  let result = null;
  for (const candidate of candidates) {
    const info = PROVIDERS[candidate.provider];
    try {
      const client = createLlmClient(candidate.provider, getApiKey(candidate.provider), candidate.model, {
        temperature: route.temperature,
        effort: route.effort,
      });
      const text = await client.chat(systemPrompt, userPrompt, {
        requestLabel: `Web stage interview (${info.name} ${candidate.model})`,
      });
      if (!text?.trim()) throw new Error('The model returned an empty response.');
      result = {
        text,
        provider: `${info.name} · ${candidate.model}`,
        providerId: candidate.provider,
        model: candidate.model,
        temperature: client.generation.temperature,
        effort: client.generation.effort,
        routeSource: candidate.source,
        failovers: failures,
      };
      break;
    } catch (error) {
      // A cancelled or timed-out request consumed the interview time budget.
      if (error instanceof LlmRequestAbortError || error instanceof LlmRequestTimeoutError) throw error;
      failures.push({ provider: candidate.provider, model: candidate.model, error: describeError(error) });
    }
  }

  if (!result) {
    const detail = failures.map((failure) => `${failure.provider}/${failure.model}: ${failure.error}`).join(' | ');
    throw new Error(`All routed AI models failed. ${detail}`);
  }
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
