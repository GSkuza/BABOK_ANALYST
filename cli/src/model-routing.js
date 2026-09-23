/**
 * Advanced model routing: choose provider, model, temperature and reasoning
 * effort per pipeline profile and per stage, with an ordered fallback chain
 * that can span every configured API key.
 *
 * Resolution order (most specific wins, per field):
 *   stage rule → profile default → global default → active provider default.
 * Provider and model are resolved as a pair from the first level that sets a
 * provider. Temperature, effort and fallbacks inherit independently.
 */
import fs from 'fs';
import path from 'path';
import { EFFORT_LEVELS, PROVIDERS } from './llm.js';

export const MODEL_ROUTING_FILE_NAME = '.babok_model_routing.json';
export const MODEL_ROUTING_VERSION = 1;
export const MAX_FALLBACKS = 10;

const PROFILE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const MAX_MODEL_LENGTH = 256;

export class ModelRoutingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelRoutingError';
  }
}

export function getModelRoutingPath(cwd = process.cwd()) {
  return process.env.BABOK_MODEL_ROUTING_FILE
    ? path.resolve(process.env.BABOK_MODEL_ROUTING_FILE)
    : path.join(cwd, MODEL_ROUTING_FILE_NAME);
}

export function emptyModelRouting() {
  return {
    version: MODEL_ROUTING_VERSION,
    failover_all_providers: false,
    default: {},
    profiles: {},
  };
}

function normalizeProvider(value, where, providers) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !providers[value]) {
    throw new ModelRoutingError(`${where}: unknown provider "${value}".`);
  }
  return value;
}

function normalizeModel(value, where) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new ModelRoutingError(`${where}: model must be a string.`);
  const model = value.trim();
  if (!model) return null;
  if (model.length > MAX_MODEL_LENGTH || /[\u0000-\u001f]/.test(model)) {
    throw new ModelRoutingError(`${where}: invalid model identifier.`);
  }
  return model;
}

function normalizeTemperature(value, where) {
  if (value === undefined || value === null || value === '') return null;
  const temperature = typeof value === 'string' ? Number(value) : value;
  if (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
    throw new ModelRoutingError(`${where}: temperature must be a number between 0 and 2.`);
  }
  return Math.round(temperature * 100) / 100;
}

function normalizeEffort(value, where) {
  if (value === undefined || value === null || value === '') return null;
  if (!EFFORT_LEVELS.includes(value)) {
    throw new ModelRoutingError(`${where}: effort must be one of ${EFFORT_LEVELS.join(', ')}.`);
  }
  return value;
}

function normalizeTarget(value, where, providers) {
  if (!value || typeof value !== 'object') throw new ModelRoutingError(`${where}: invalid fallback entry.`);
  const provider = normalizeProvider(value.provider, where, providers);
  if (!provider) throw new ModelRoutingError(`${where}: fallback provider is required.`);
  return { provider, model: normalizeModel(value.model, where) };
}

function normalizeRule(value, where, providers) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new ModelRoutingError(`${where}: rule must be an object.`);
  }
  const rule = {};
  const provider = normalizeProvider(value.provider, where, providers);
  const model = normalizeModel(value.model, where);
  if (model && !provider) throw new ModelRoutingError(`${where}: a model requires a provider.`);
  if (provider) {
    rule.provider = provider;
    if (model) rule.model = model;
  }
  const temperature = normalizeTemperature(value.temperature, where);
  if (temperature !== null) rule.temperature = temperature;
  const effort = normalizeEffort(value.effort, where);
  if (effort !== null) rule.effort = effort;
  if (Array.isArray(value.fallbacks)) {
    if (value.fallbacks.length > MAX_FALLBACKS) {
      throw new ModelRoutingError(`${where}: at most ${MAX_FALLBACKS} fallbacks are allowed.`);
    }
    rule.fallbacks = value.fallbacks.map((entry, index) => normalizeTarget(entry, `${where} fallback ${index + 1}`, providers));
  } else if (value.fallbacks !== undefined && value.fallbacks !== null) {
    throw new ModelRoutingError(`${where}: fallbacks must be an array.`);
  }
  return rule;
}

/**
 * Validate and canonicalise a routing document. Empty rules are dropped so the
 * stored file only contains explicit overrides.
 */
export function normalizeModelRouting(raw, { providers = PROVIDERS } = {}) {
  if (raw === undefined || raw === null) return emptyModelRouting();
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ModelRoutingError('Routing configuration must be an object.');
  }
  const routing = emptyModelRouting();
  routing.failover_all_providers = raw.failover_all_providers === true;
  routing.default = normalizeRule(raw.default, 'Global default', providers);

  const profiles = raw.profiles ?? {};
  if (typeof profiles !== 'object' || Array.isArray(profiles)) {
    throw new ModelRoutingError('profiles must be an object.');
  }
  for (const [profileId, profileRaw] of Object.entries(profiles)) {
    if (!PROFILE_ID_PATTERN.test(profileId)) throw new ModelRoutingError(`Invalid profile id "${profileId}".`);
    if (!profileRaw || typeof profileRaw !== 'object' || Array.isArray(profileRaw)) {
      throw new ModelRoutingError(`Profile "${profileId}" must be an object.`);
    }
    const profile = { default: normalizeRule(profileRaw.default, `Profile ${profileId} default`, providers), stages: {} };
    const stages = profileRaw.stages ?? {};
    if (typeof stages !== 'object' || Array.isArray(stages)) {
      throw new ModelRoutingError(`Profile "${profileId}" stages must be an object.`);
    }
    for (const [stageKey, stageRaw] of Object.entries(stages)) {
      const stage = Number(stageKey);
      if (!Number.isInteger(stage) || stage < 0 || stage > 99 || String(stage) !== stageKey) {
        throw new ModelRoutingError(`Profile "${profileId}": invalid stage "${stageKey}".`);
      }
      const rule = normalizeRule(stageRaw, `Profile ${profileId} stage ${stage}`, providers);
      if (Object.keys(rule).length) profile.stages[stageKey] = rule;
    }
    if (Object.keys(profile.default).length || Object.keys(profile.stages).length) {
      routing.profiles[profileId] = profile;
    }
  }
  return routing;
}

export function readModelRouting(options = {}) {
  const filePath = options.filePath || getModelRoutingPath(options.cwd);
  if (!fs.existsSync(filePath)) return emptyModelRouting();
  try {
    return normalizeModelRouting(JSON.parse(fs.readFileSync(filePath, 'utf-8')), options);
  } catch {
    // A corrupt or outdated file must never break interviews; fall back to defaults.
    return emptyModelRouting();
  }
}

export function writeModelRouting(raw, options = {}) {
  const routing = normalizeModelRouting(raw, options);
  const filePath = options.filePath || getModelRoutingPath(options.cwd);
  const document = {
    _NOTE: 'Generated by BABOK Analyst AI settings. Contains no credentials.',
    ...routing,
    updated_at: new Date().toISOString(),
  };
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');
  fs.renameSync(tempPath, filePath);
  return routing;
}

function firstDefined(levels, field) {
  for (const level of levels) {
    if (level.rule[field] !== undefined && level.rule[field] !== null) {
      return { value: level.rule[field], source: level.source };
    }
  }
  return { value: null, source: 'provider_default' };
}

/**
 * Resolve the ordered list of provider/model candidates for a profile stage.
 *
 * @param {object} routingConfig
 * @param {{ profile?: string, stage?: number|null, availableProviders?: string[], preferredProvider?: string|null, providers?: object }} context
 */
export function resolveModelRoute(routingConfig, context = {}) {
  const providers = context.providers || PROVIDERS;
  const routing = normalizeModelRouting(routingConfig, { providers });
  const available = (context.availableProviders || []).filter(provider => providers[provider]);
  const profileId = context.profile || 'babok';
  const profile = routing.profiles[profileId];
  const stage = Number.isInteger(context.stage) ? String(context.stage) : null;

  const levels = [];
  if (profile && stage !== null && profile.stages[stage]) levels.push({ source: 'stage', rule: profile.stages[stage] });
  if (profile) levels.push({ source: 'profile', rule: profile.default });
  levels.push({ source: 'global', rule: routing.default });

  const targetLevel = levels.find(level => level.rule.provider);
  const preferred = context.preferredProvider && available.includes(context.preferredProvider)
    ? context.preferredProvider
    : available[0] ?? null;

  let primary = null;
  let modelSource = 'active_provider';
  if (targetLevel) {
    const provider = targetLevel.rule.provider;
    primary = { provider, model: targetLevel.rule.model || providers[provider].defaultModel };
    modelSource = targetLevel.source;
  } else if (preferred) {
    primary = { provider: preferred, model: providers[preferred].defaultModel };
  }

  const temperature = firstDefined(levels, 'temperature');
  const effort = firstDefined(levels, 'effort');
  const fallbacks = firstDefined(levels, 'fallbacks');

  const planned = [];
  const seen = new Set();
  const push = (target, source) => {
    if (!target?.provider || !providers[target.provider]) return;
    const model = target.model || providers[target.provider].defaultModel;
    const key = `${target.provider}::${model}`;
    if (seen.has(key)) return;
    seen.add(key);
    planned.push({ provider: target.provider, model, source });
  };
  push(primary, modelSource);
  for (const target of fallbacks.value || []) push(target, 'fallback');
  if (routing.failover_all_providers) {
    const covered = new Set(planned.map(candidate => candidate.provider));
    for (const provider of available) {
      if (!covered.has(provider)) push({ provider }, 'failover_all');
    }
  }

  const candidates = planned.filter(candidate => available.includes(candidate.provider));
  const skipped = planned.filter(candidate => !available.includes(candidate.provider));
  if (candidates.length === 0 && preferred) {
    candidates.push({ provider: preferred, model: providers[preferred].defaultModel, source: 'active_provider' });
  }

  return {
    profile: profileId,
    stage: stage === null ? null : Number(stage),
    temperature: temperature.value,
    effort: effort.value,
    sources: {
      model: candidates[0]?.source ?? null,
      temperature: temperature.source,
      effort: effort.source,
      fallbacks: fallbacks.source,
    },
    candidates,
    skipped,
  };
}
