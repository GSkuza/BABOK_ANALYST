import chalk from 'chalk';
import fs from 'fs';
import { PROVIDERS } from '../llm.js';
import { listProfileIds, loadProfile } from '../profiles.js';
import { resolveProjectId } from '../project.js';
import { readJournal } from '../journal.js';
import {
  describeModelRoute,
  getModelRoutingPath,
  ModelRoutingError,
  readModelRouting,
  removeModelRoutingRule,
  setModelRoutingRule,
  writeModelRouting,
} from '../model-routing.js';
import { listConfiguredProviders, resolveConfiguredRoute } from '../routed-llm.js';

export function collectRepeatable(value, previous = []) {
  return [...previous, value];
}

function fail(message) {
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
}

function parseStage(value) {
  if (value === undefined || value === null) return null;
  const stage = Number(value);
  if (!Number.isInteger(stage) || stage < 0) fail(`invalid stage "${value}".`);
  return stage;
}

function validateTarget(profileId, stage) {
  if (!profileId) {
    if (stage !== null) fail('--stage requires --profile.');
    return;
  }
  if (!listProfileIds().includes(profileId)) {
    fail(`unknown profile "${profileId}". Available: ${listProfileIds().join(', ')}`);
  }
  if (stage !== null && !loadProfile(profileId).stages.some(s => s.stage === stage)) {
    fail(`profile "${profileId}" has no stage ${stage}.`);
  }
}

function parseInheritable(value, parse) {
  if (value === undefined) return undefined;
  if (String(value).toLowerCase() === 'none') return null;
  return parse(value);
}

function parseFallbacks(values) {
  if (!values?.length) return undefined;
  if (values.length === 1 && values[0].toLowerCase() === 'none') return [];
  return values.map((value) => {
    const separator = value.indexOf(':');
    const provider = separator === -1 ? value : value.slice(0, separator);
    const model = separator === -1 ? null : value.slice(separator + 1) || null;
    return { provider, model };
  });
}

function saveOrFail(update) {
  try {
    const routing = writeModelRouting(update(readModelRouting()), { providers: PROVIDERS });
    console.log(chalk.green(`✓ Model routing saved: ${getModelRoutingPath()}`));
    return routing;
  } catch (error) {
    if (error instanceof ModelRoutingError) fail(error.message);
    throw error;
  }
}

function describeRule(rule = {}) {
  const parts = [];
  if (rule.provider) parts.push(`${rule.provider}${rule.model ? ` · ${rule.model}` : ' · (default model)'}`);
  if (rule.temperature !== undefined) parts.push(`temperature ${rule.temperature}`);
  if (rule.effort) parts.push(`effort ${rule.effort}`);
  if (rule.fallbacks) {
    parts.push(rule.fallbacks.length
      ? `fallbacks ${rule.fallbacks.map(f => `${f.provider}${f.model ? `:${f.model}` : ''}`).join(' → ')}`
      : 'fallbacks cleared');
  }
  return parts.length ? parts.join(', ') : chalk.dim('(inherit)');
}

export function routingShowCommand(options = {}) {
  const routing = readModelRouting();
  if (options.json) {
    console.log(JSON.stringify(routing, null, 2));
    return;
  }
  const configured = listConfiguredProviders();
  console.log(chalk.bold('\nAdvanced model routing'));
  console.log(chalk.dim(`  File: ${getModelRoutingPath()}${fs.existsSync(getModelRoutingPath()) ? '' : ' (not created yet)'}`));
  console.log(`  Providers with API keys: ${configured.length ? configured.join(', ') : chalk.yellow('none')}`);
  console.log(`  Fail over across every configured key: ${routing.failover_all_providers ? chalk.green('on') : 'off'}`);
  console.log(`  Global default: ${describeRule(routing.default)}`);
  for (const [profileId, profile] of Object.entries(routing.profiles)) {
    console.log(chalk.cyan(`\n  Profile ${profileId}`));
    console.log(`    default: ${describeRule(profile.default)}`);
    for (const [stage, rule] of Object.entries(profile.stages)) {
      console.log(`    stage ${stage}: ${describeRule(rule)}`);
    }
  }
  console.log('');
}

export function routingResolveCommand(options = {}) {
  let profileId = options.profile || null;
  let stage = parseStage(options.stage);
  if (options.project) {
    const projectId = resolveProjectId(options.project);
    if (!projectId) fail(`project not found: ${options.project}`);
    const journal = readJournal(projectId);
    profileId ??= journal.profile || 'babok';
    stage ??= journal.current_stage;
  }
  profileId ??= 'babok';
  validateTarget(profileId, stage);
  const route = resolveConfiguredRoute({ profile: profileId, stage });
  if (options.json) {
    console.log(JSON.stringify(route, null, 2));
    return;
  }
  console.log(`\n${describeModelRoute(route, PROVIDERS)}\n`);
}

export function routingSetCommand(options = {}) {
  const profileId = options.profile || null;
  const stage = parseStage(options.stage);
  validateTarget(profileId, stage);
  if (options.model && !options.provider) {
    const current = readModelRouting();
    const existing = !profileId
      ? current.default
      : stage === null ? current.profiles[profileId]?.default : current.profiles[profileId]?.stages[String(stage)];
    if (!existing?.provider) fail('--model requires --provider.');
  }
  const patch = {
    provider: parseInheritable(options.provider, v => v),
    model: parseInheritable(options.model, v => v),
    temperature: parseInheritable(options.temperature, v => Number(v)),
    effort: parseInheritable(options.effort, v => v.toLowerCase()),
    fallbacks: parseFallbacks(options.fallback),
  };
  if (Object.values(patch).every(v => v === undefined)) {
    fail('nothing to set. Use --provider, --model, --temperature, --effort or --fallback.');
  }
  const routing = saveOrFail(current => setModelRoutingRule(current, { profile: profileId, stage }, patch, { providers: PROVIDERS }));
  const rule = !profileId
    ? routing.default
    : stage === null ? routing.profiles[profileId]?.default : routing.profiles[profileId]?.stages[String(stage)];
  const label = !profileId ? 'Global default' : stage === null ? `Profile ${profileId} default` : `Profile ${profileId} stage ${stage}`;
  console.log(`  ${label}: ${describeRule(rule)}`);
}

export function routingUnsetCommand(options = {}) {
  const profileId = options.profile || null;
  const stage = parseStage(options.stage);
  validateTarget(profileId, stage);
  saveOrFail(current => removeModelRoutingRule(current, { profile: profileId, stage }, { providers: PROVIDERS }));
}

export function routingFailoverCommand(state) {
  const value = String(state).toLowerCase();
  if (!['on', 'off', 'true', 'false'].includes(value)) fail('state must be "on" or "off".');
  const enabled = value === 'on' || value === 'true';
  saveOrFail(current => ({ ...current, failover_all_providers: enabled }));
  console.log(`  Fail over across every configured API key: ${enabled ? 'on' : 'off'}`);
}

export function routingResetCommand() {
  saveOrFail(() => ({}));
}
