import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ROUTING_PROVIDERS,
  detectConfiguredProviders,
  hasModelRoutingRules,
  normalizeModelRouting,
  removeModelRoutingRule,
  setModelRoutingRule,
} from '../../cli/src/model-routing.js';
import { EFFORT_LEVELS, LlmRequestAbortError, PROVIDERS } from '../../cli/src/llm.js';
import { activeModelRouting, createRoutedLlmClient } from '../../cli/src/routed-llm.js';
import { createTaskRouter } from '../../cli/src/router.js';
import { selectRoutedPrimary } from '../../cli/src/commands/run.js';

function fakeClients(behaviour) {
  const calls = [];
  const createClient = (provider, apiKey, model, generation) => ({
    providerName: provider,
    modelName: model,
    generation,
    chat: async (system, user) => {
      calls.push({ provider, model, apiKey, generation });
      return behaviour(provider, model);
    },
  });
  return { calls, createClient };
}

const route = {
  temperature: 0.3,
  effort: 'high',
  candidates: [
    { provider: 'anthropic', model: 'claude-opus-5', source: 'stage' },
    { provider: 'openai', model: 'gpt-5.6-terra', source: 'fallback' },
    { provider: 'gemini', model: 'gemini-2.0-flash', source: 'failover_all' },
  ],
};

describe('routed LLM client', () => {
  it('fails over in order, passes generation settings and sticks to the working candidate', async () => {
    const { calls, createClient } = fakeClients((provider) => {
      if (provider === 'anthropic') throw new Error('429 quota exceeded');
      return `answer from ${provider}`;
    });
    const failovers = [];
    const client = createRoutedLlmClient(route, {
      createClient,
      getKey: (provider) => `key-${provider}`,
      onFailover: (failure, next) => failovers.push([failure.provider, next.provider]),
    });

    assert.equal(client.providerId, 'anthropic');
    assert.equal(await client.chat('sys', 'user'), 'answer from openai');
    assert.equal(client.providerId, 'openai');
    assert.equal(client.modelName, 'gpt-5.6-terra');
    assert.deepEqual(failovers, [['anthropic', 'openai']]);
    assert.deepEqual(calls.map(c => c.provider), ['anthropic', 'openai']);
    assert.deepEqual(calls[1].generation, { temperature: 0.3, effort: 'high' });
    assert.equal(calls[1].apiKey, 'key-openai');

    await client.chat('sys', 'again');
    assert.deepEqual(calls.map(c => c.provider), ['anthropic', 'openai', 'openai']);
    assert.equal(client.failovers.length, 1);
  });

  it('fails over on an empty response except for the last candidate', async () => {
    const { calls, createClient } = fakeClients(provider => (provider === 'gemini' ? '' : '   '));
    const client = createRoutedLlmClient(route, { createClient, getKey: () => 'k' });
    assert.equal(await client.chat('s', 'u'), '');
    assert.deepEqual(calls.map(c => c.provider), ['anthropic', 'openai', 'gemini']);
  });

  it('never replays aborted requests or requests that already streamed output', async () => {
    for (const error of [new LlmRequestAbortError('cancelled'), Object.assign(new Error('stream broke'), { partialOutputEmitted: true })]) {
      const { calls, createClient } = fakeClients(() => { throw error; });
      const client = createRoutedLlmClient(route, { createClient, getKey: () => 'k' });
      await assert.rejects(client.chat('s', 'u'), err => err === error);
      assert.equal(calls.length, 1);
    }
  });

  it('attaches the failover history when every candidate fails', async () => {
    const { createClient } = fakeClients((provider) => { throw new Error(`${provider} down`); });
    const client = createRoutedLlmClient(route, { createClient, getKey: () => 'k' });
    await assert.rejects(client.chat('s', 'u'), (err) => {
      assert.equal(err.message, 'gemini down');
      assert.deepEqual(err.routeFailovers.map(f => f.provider), ['anthropic', 'openai']);
      return true;
    });
  });

  it('requires at least one candidate', () => {
    assert.throws(() => createRoutedLlmClient({ candidates: [] }), /No configured LLM provider/);
  });
});

describe('task router with advanced model routing', () => {
  const saved = {};
  const setEnv = (values) => {
    for (const [key, value] of Object.entries(values)) {
      saved[key] ??= process.env[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
      delete saved[key];
    }
  });

  const modelRouting = {
    failover_all_providers: true,
    default: { provider: 'openai', model: 'gpt-5.6-luna', temperature: 0.5 },
    profiles: {
      consulting: {
        default: { effort: 'medium' },
        stages: { 3: { provider: 'anthropic', model: 'claude-opus-5', effort: 'high' } },
      },
    },
  };

  it('routes each stage of the profile to its own provider, model, temperature and effort', () => {
    setEnv({ OPENAI_API_KEY: 'sk-test-openai', ANTHROPIC_API_KEY: 'sk-ant-test' });
    const router = createTaskRouter({
      primaryProvider: 'openai',
      primaryApiKey: 'sk-test-openai',
      primaryModel: 'gpt-5.6-luna',
      modelRouting,
      profileId: 'consulting',
      availableProviders: ['openai', 'anthropic'],
    });

    const stage3 = router.getStageClient(3);
    assert.equal(stage3.providerId, 'anthropic');
    assert.equal(stage3.modelName, 'claude-opus-5');
    assert.deepEqual(stage3.generation, { temperature: 0.5, effort: 'high' });
    assert.deepEqual(stage3.candidates.map(c => c.provider), ['anthropic', 'openai']);
    assert.equal(typeof stage3.classifyVerdict, 'function');

    const stage2 = router.getStageClient(2);
    assert.equal(stage2.providerId, 'openai');
    assert.equal(stage2.modelName, 'gpt-5.6-luna');
    assert.deepEqual(stage2.generation, { temperature: 0.5, effort: 'medium' });
  });

  it('keeps the legacy provider/model routing when no model routing is supplied', () => {
    const router = createTaskRouter({ primaryProvider: 'openai', primaryApiKey: 'sk-test-openai', primaryModel: 'gpt-5.6-luna' });
    const client = router.getStageClient(2);
    assert.equal(client.modelName, 'gpt-5.6-luna');
    assert.equal(client.candidates, undefined);
  });

  it('babok run uses routing only without explicit --provider/--model/--deep-model and without --no-routing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-run-routing-'));
    const file = path.join(dir, 'routing.json');
    fs.writeFileSync(file, JSON.stringify(modelRouting));
    setEnv({ BABOK_MODEL_ROUTING_FILE: file, OPENAI_API_KEY: 'sk-test-openai', ANTHROPIC_API_KEY: 'sk-ant-test' });
    try {
      const profile = { id: 'consulting' };
      assert.deepEqual(selectRoutedPrimary({}, profile), {
        modelRouting: normalizeModelRouting(modelRouting),
        provider: 'openai',
        apiKey: 'sk-test-openai',
        model: 'gpt-5.6-luna',
      });
      assert.equal(selectRoutedPrimary({ provider: 'anthropic' }, profile), null);
      assert.equal(selectRoutedPrimary({ model: 'x' }, profile), null);
      assert.equal(selectRoutedPrimary({ deepModel: 'x' }, profile), null);
      assert.equal(selectRoutedPrimary({ routing: false }, profile), null);
      fs.writeFileSync(file, JSON.stringify({}));
      assert.equal(activeModelRouting(), null);
      assert.equal(selectRoutedPrimary({}, profile), null);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('model routing editing and credential detection', () => {
  it('keeps the dependency-free provider catalog aligned with the CLI providers', () => {
    assert.deepEqual(Object.keys(ROUTING_PROVIDERS), Object.keys(PROVIDERS));
    for (const [id, info] of Object.entries(ROUTING_PROVIDERS)) {
      assert.equal(info.name, PROVIDERS[id].name, id);
      assert.equal(info.envKey, PROVIDERS[id].envKey, id);
      assert.equal(info.defaultModel, PROVIDERS[id].defaultModel, id);
    }
    assert.deepEqual(EFFORT_LEVELS, ['minimal', 'low', 'medium', 'high']);
  });

  it('patches and removes rules at every level', () => {
    let routing = setModelRoutingRule({}, {}, { provider: 'openai', model: 'gpt-5.6-luna', temperature: 0.2 });
    routing = setModelRoutingRule(routing, { profile: 'consulting', stage: 4 }, { provider: 'anthropic', effort: 'low' });
    routing = setModelRoutingRule(routing, { profile: 'consulting', stage: 4 }, { model: 'claude-opus-5', fallbacks: [] });
    assert.deepEqual(routing.default, { provider: 'openai', model: 'gpt-5.6-luna', temperature: 0.2 });
    assert.deepEqual(routing.profiles.consulting.stages['4'], { provider: 'anthropic', model: 'claude-opus-5', effort: 'low', fallbacks: [] });
    assert.ok(hasModelRoutingRules(routing));

    routing = setModelRoutingRule(routing, {}, { provider: 'gemini' });
    assert.deepEqual(routing.default, { provider: 'gemini', temperature: 0.2 }, 'changing provider drops the other provider model');
    routing = setModelRoutingRule(routing, {}, { temperature: null });
    assert.deepEqual(routing.default, { provider: 'gemini' });

    assert.throws(() => setModelRoutingRule(routing, { stage: 1 }, { temperature: 1 }), /requires a profile/);
    routing = removeModelRoutingRule(routing, { profile: 'consulting', stage: 4 });
    assert.deepEqual(routing.profiles, {});
    routing = removeModelRoutingRule(routing, {});
    assert.equal(hasModelRoutingRules(routing), false);
  });

  it('detects configured providers from env, .env and keystore entries without decrypting keys', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-detect-'));
    try {
      fs.writeFileSync(path.join(dir, '.env'), 'ANTHROPIC_API_KEY=sk-ant-x\nHF_API_KEY=\n');
      fs.writeFileSync(path.join(dir, '.babok_keystore'), JSON.stringify({ gemini: { k: 'opaque' }, _preferred_provider: 'gemini' }));
      const detected = detectConfiguredProviders({ baseDir: dir, env: { OPENAI_API_KEY: 'sk-x' } });
      assert.deepEqual(detected, { providers: ['gemini', 'openai', 'anthropic'], preferredProvider: 'gemini' });
      assert.deepEqual(detectConfiguredProviders({ baseDir: path.join(dir, 'missing'), env: {} }), { providers: [], preferredProvider: null });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
