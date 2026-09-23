import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ModelRoutingError,
  normalizeModelRouting,
  readModelRouting,
  resolveModelRoute,
  writeModelRouting,
} from '../../cli/src/model-routing.js';
import { PROVIDERS } from '../../cli/src/llm.js';

const routing = {
  failover_all_providers: false,
  default: {
    provider: 'openai',
    model: 'gpt-5.6-terra',
    temperature: 0.4,
    fallbacks: [{ provider: 'anthropic', model: 'claude-sonnet-5' }],
  },
  profiles: {
    consulting: {
      default: { provider: 'anthropic', model: 'claude-opus-5', effort: 'high' },
      stages: {
        3: { provider: 'gemini', model: 'gemini-2.5-pro', temperature: 0.1 },
        5: { temperature: 0.9 },
      },
    },
    'software-development': {
      default: {},
      stages: { 1: { effort: 'low', fallbacks: [] } },
    },
  },
};

const available = ['openai', 'anthropic', 'gemini'];

describe('model routing resolution', () => {
  it('uses the global default when no profile rule exists', () => {
    const route = resolveModelRoute(routing, { profile: 'babok', stage: 4, availableProviders: available });
    assert.deepEqual(route.candidates.map(c => `${c.provider}/${c.model}/${c.source}`), [
      'openai/gpt-5.6-terra/global',
      'anthropic/claude-sonnet-5/fallback',
    ]);
    assert.equal(route.temperature, 0.4);
    assert.equal(route.effort, null);
  });

  it('applies profile defaults and per-stage overrides field by field', () => {
    const stage3 = resolveModelRoute(routing, { profile: 'consulting', stage: 3, availableProviders: available });
    assert.equal(stage3.candidates[0].provider, 'gemini');
    assert.equal(stage3.candidates[0].model, 'gemini-2.5-pro');
    assert.equal(stage3.candidates[0].source, 'stage');
    assert.equal(stage3.temperature, 0.1);
    assert.equal(stage3.effort, 'high');
    assert.equal(stage3.sources.effort, 'profile');

    const stage5 = resolveModelRoute(routing, { profile: 'consulting', stage: 5, availableProviders: available });
    assert.equal(stage5.candidates[0].model, 'claude-opus-5');
    assert.equal(stage5.candidates[0].source, 'profile');
    assert.equal(stage5.temperature, 0.9);
  });

  it('lets a stage clear inherited fallbacks with an empty chain', () => {
    const route = resolveModelRoute(routing, { profile: 'software-development', stage: 1, availableProviders: available });
    assert.deepEqual(route.candidates.map(c => c.provider), ['openai']);
    assert.equal(route.effort, 'low');
  });

  it('fails over across every configured API key when enabled', () => {
    const route = resolveModelRoute({ ...routing, failover_all_providers: true }, {
      profile: 'babok', stage: 0, availableProviders: [...available, 'huggingface'],
    });
    assert.deepEqual(route.candidates.map(c => `${c.provider}:${c.source}`), [
      'openai:global',
      'anthropic:fallback',
      'gemini:failover_all',
      'huggingface:failover_all',
    ]);
    assert.equal(route.candidates[2].model, PROVIDERS.gemini.defaultModel);
  });

  it('skips providers without a key and falls back to the active provider', () => {
    const route = resolveModelRoute(routing, { profile: 'babok', stage: 0, availableProviders: ['gemini'], preferredProvider: 'gemini' });
    assert.deepEqual(route.skipped.map(c => c.provider), ['openai', 'anthropic']);
    assert.deepEqual(route.candidates, [{ provider: 'gemini', model: PROVIDERS.gemini.defaultModel, source: 'active_provider' }]);
  });

  it('uses the preferred provider when no routing is configured', () => {
    const route = resolveModelRoute({}, { profile: 'babok', stage: 2, availableProviders: available, preferredProvider: 'anthropic' });
    assert.deepEqual(route.candidates.map(c => c.provider), ['anthropic']);
    assert.equal(route.temperature, null);
  });
});

describe('model routing validation and storage', () => {
  it('rejects invalid values', () => {
    assert.throws(() => normalizeModelRouting({ default: { provider: 'nope' } }), ModelRoutingError);
    assert.throws(() => normalizeModelRouting({ default: { provider: 'openai', temperature: 5 } }), /temperature/);
    assert.throws(() => normalizeModelRouting({ default: { effort: 'max' } }), /effort/);
    assert.throws(() => normalizeModelRouting({ default: { model: 'gpt-x' } }), /requires a provider/);
    assert.throws(() => normalizeModelRouting({ profiles: { babok: { stages: { abc: {} } } } }), /invalid stage/);
  });

  it('drops empty rules and round-trips through the routing file', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-routing-'));
    const filePath = path.join(dir, 'routing.json');
    try {
      const saved = writeModelRouting({
        ...routing,
        profiles: { ...routing.profiles, babok: { default: {}, stages: { 2: {} } } },
      }, { filePath });
      assert.equal(saved.profiles.babok, undefined);
      const stored = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.match(stored._NOTE, /no credentials/i);
      assert.deepEqual(readModelRouting({ filePath }), saved);
      assert.equal(saved.profiles.consulting.stages['3'].model, 'gemini-2.5-pro');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores a corrupt routing file instead of breaking interviews', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'babok-routing-'));
    const filePath = path.join(dir, 'routing.json');
    try {
      fs.writeFileSync(filePath, '{not json');
      assert.deepEqual(readModelRouting({ filePath }).profiles, {});
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
