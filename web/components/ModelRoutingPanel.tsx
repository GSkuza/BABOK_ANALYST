'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Cpu,
  Layers,
  LoaderCircle,
  Plus,
  RefreshCw,
  Route,
  Save,
  X,
} from 'lucide-react';
import type {
  AiModelCatalog,
  EffortLevel,
  ModelRouting,
  ModelRoutingRule,
  ModelRoutingState,
  ModelTarget,
  RoutingProfileSummary,
} from '@/lib/ai-settings';
import { previewModelRoute, type RouteSource } from '@/lib/model-routing-preview';

interface Props {
  refreshKey: number;
}

const PROFILE_LABELS: Record<string, string> = {
  babok: 'IT (BABOK)',
  consulting: 'Consulting',
  'software-development': 'Software development',
};

const SOURCE_LABELS: Record<RouteSource, string> = {
  stage: 'stage',
  profile: 'profile default',
  global: 'global default',
  active_provider: 'active provider',
  fallback: 'fallback',
  failover_all: 'auto failover',
  provider_default: 'provider default',
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-500/10';
const secondaryButton = 'inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800';

function emptyRouting(): ModelRouting {
  return { version: 1, failover_all_providers: false, default: {}, profiles: {} };
}

function targetValue(provider?: string | null, model?: string | null) {
  return provider ? `${provider}::${model ?? ''}` : '';
}

function parseTarget(value: string): ModelTarget | null {
  if (!value) return null;
  const index = value.indexOf('::');
  const provider = value.slice(0, index);
  const model = value.slice(index + 2);
  return { provider, model: model || null };
}

function cleanRule(rule: ModelRoutingRule): ModelRoutingRule {
  const next: ModelRoutingRule = {};
  if (rule.provider) {
    next.provider = rule.provider;
    if (rule.model) next.model = rule.model;
  }
  if (typeof rule.temperature === 'number') next.temperature = rule.temperature;
  if (rule.effort) next.effort = rule.effort;
  if (Array.isArray(rule.fallbacks)) next.fallbacks = rule.fallbacks.filter((entry) => entry.provider);
  return next;
}

interface ModelSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  catalog: AiModelCatalog | null;
  emptyLabel: string | null;
  disabled?: boolean;
}

function ModelSelect({ id, value, onChange, catalog, emptyLabel, disabled }: ModelSelectProps) {
  const configured = catalog?.providers.filter((provider) => provider.configured) ?? [];
  const known = new Set(configured.flatMap((provider) => [
    targetValue(provider.id, null),
    ...provider.models.map((model) => targetValue(provider.id, model)),
  ]));
  const parsed = parseTarget(value);
  return (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={inputClass}>
      {emptyLabel !== null ? <option value="">{emptyLabel}</option> : null}
      {value && !known.has(value) ? (
        <option value={value}>{`${parsed?.provider}/${parsed?.model ?? 'default'} (not available)`}</option>
      ) : null}
      {configured.map((provider) => (
        <optgroup key={provider.id} label={provider.name}>
          <option value={targetValue(provider.id, null)}>{`${provider.name} — default (${provider.defaultModel})`}</option>
          {provider.models.map((model) => (
            <option key={model} value={targetValue(provider.id, model)}>{model}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

interface RuleEditorProps {
  idPrefix: string;
  title: string;
  subtitle?: string;
  rule: ModelRoutingRule;
  onChange: (rule: ModelRoutingRule) => void;
  catalog: AiModelCatalog | null;
  effortLevels: EffortLevel[];
  inheritLabel: string | null;
  summary: ReactNode;
  disabled?: boolean;
}

function RuleEditor({
  idPrefix,
  title,
  subtitle,
  rule,
  onChange,
  catalog,
  effortLevels,
  inheritLabel,
  summary,
  disabled,
}: RuleEditorProps) {
  const [showFallbacks, setShowFallbacks] = useState(Array.isArray(rule.fallbacks) && rule.fallbacks.length > 0);
  const fallbacksInherited = !Array.isArray(rule.fallbacks);
  const fallbackCount = rule.fallbacks?.length ?? 0;
  const update = (patch: Partial<ModelRoutingRule>) => onChange(cleanRule({ ...rule, ...patch }));

  return (
    <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800">
      <div className="grid gap-3 lg:grid-cols-[minmax(160px,1fr)_minmax(220px,2fr)_110px_150px_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-model`} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Model</label>
          <ModelSelect
            id={`${idPrefix}-model`}
            value={targetValue(rule.provider, rule.model)}
            onChange={(value) => {
              const target = parseTarget(value);
              update({ provider: target?.provider ?? null, model: target?.model ?? null });
            }}
            catalog={catalog}
            emptyLabel={inheritLabel ?? 'Active provider default'}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-temperature`} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Temperature</label>
          <input
            id={`${idPrefix}-temperature`}
            type="number"
            min={0}
            max={2}
            step={0.05}
            value={rule.temperature ?? ''}
            placeholder={inheritLabel ? 'inherit' : 'default'}
            onChange={(event) => {
              const raw = event.target.value;
              const parsed = raw === '' ? null : Number(raw);
              update({ temperature: parsed === null || Number.isNaN(parsed) ? null : Math.min(2, Math.max(0, parsed)) });
            }}
            disabled={disabled}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-effort`} className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Effort</label>
          <select
            id={`${idPrefix}-effort`}
            value={rule.effort ?? ''}
            onChange={(event) => update({ effort: (event.target.value || null) as EffortLevel | null })}
            disabled={disabled}
            className={inputClass}
          >
            <option value="">{inheritLabel ? 'Inherit' : 'Provider default'}</option>
            {effortLevels.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setShowFallbacks((value) => !value)} className={secondaryButton} aria-expanded={showFallbacks}>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFallbacks ? 'rotate-180' : ''}`} />
          Fallbacks {fallbacksInherited && inheritLabel ? '(inherit)' : `(${fallbackCount})`}
        </button>
      </div>

      {showFallbacks ? (
        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
          {inheritLabel ? (
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={!fallbacksInherited}
                onChange={(event) => update({ fallbacks: event.target.checked ? [] : null })}
                disabled={disabled}
              />
              Use a custom fallback chain for this level
            </label>
          ) : null}
          {!fallbacksInherited || !inheritLabel ? (
            <>
              {(rule.fallbacks ?? []).map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-6 text-xs font-semibold text-slate-400">{index + 1}.</span>
                  <ModelSelect
                    id={`${idPrefix}-fallback-${index}`}
                    value={targetValue(entry.provider, entry.model)}
                    onChange={(value) => {
                      const target = parseTarget(value);
                      if (!target) return;
                      const fallbacks = [...(rule.fallbacks ?? [])];
                      fallbacks[index] = target;
                      update({ fallbacks });
                    }}
                    catalog={catalog}
                    emptyLabel={null}
                    disabled={disabled}
                  />
                  <button
                    type="button"
                    aria-label="Remove fallback"
                    onClick={() => update({ fallbacks: (rule.fallbacks ?? []).filter((_, position) => position !== index) })}
                    disabled={disabled}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={disabled || (rule.fallbacks?.length ?? 0) >= 10 || !catalog?.providers.some((provider) => provider.configured)}
                onClick={() => {
                  const first = catalog?.providers.find((provider) => provider.configured && provider.id !== rule.provider)
                    ?? catalog?.providers.find((provider) => provider.configured);
                  if (!first) return;
                  update({ fallbacks: [...(rule.fallbacks ?? []), { provider: first.id, model: null }] });
                }}
                className={secondaryButton}
              >
                <Plus className="h-3.5 w-3.5" />
                Add fallback model
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fallbacks are tried in order when the primary model fails (invalid key, quota, rate limit, unavailable model).
              </p>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{summary}</div>
    </div>
  );
}

export function ModelRoutingPanel({ refreshKey }: Props) {
  const [catalog, setCatalog] = useState<AiModelCatalog | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [state, setState] = useState<ModelRoutingState | null>(null);
  const [routing, setRouting] = useState<ModelRouting>(emptyRouting());
  const [activeProfile, setActiveProfile] = useState<string>('babok');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchCatalog = useCallback(async () => {
    const response = await fetch('/api/settings/ai/models', { cache: 'no-store' });
    const body = (await response.json().catch(() => null)) as (AiModelCatalog & { error?: string }) | null;
    if (!response.ok || !body?.providers) throw new Error(body?.error ?? `Model discovery failed with status ${response.status}`);
    return body;
  }, []);

  const applyCatalog = useCallback((promise: Promise<AiModelCatalog>, isCancelled: () => boolean = () => false) => promise
    .then((body) => {
      if (isCancelled()) return;
      setCatalog(body);
      setCatalogError(null);
    })
    .catch((error: unknown) => {
      if (!isCancelled()) setCatalogError(error instanceof Error ? error.message : 'Unable to list AI models.');
    })
    .finally(() => {
      if (!isCancelled()) setCatalogLoading(false);
    }), []);

  const loadCatalog = useCallback(() => {
    setCatalogLoading(true);
    return applyCatalog(fetchCatalog());
  }, [applyCatalog, fetchCatalog]);

  useEffect(() => {
    let cancelled = false;
    applyCatalog(fetchCatalog(), () => cancelled);
    return () => { cancelled = true; };
  }, [applyCatalog, fetchCatalog, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/settings/ai/routing', { cache: 'no-store' });
        const body = (await response.json().catch(() => null)) as (ModelRoutingState & { error?: string }) | null;
        if (!response.ok || !body?.routing) throw new Error(body?.error ?? `Routing request failed with status ${response.status}`);
        if (cancelled) return;
        setState(body);
        setRouting(body.routing);
        setActiveProfile((current) => body.profiles.some((profile) => profile.id === current) ? current : body.profiles[0]?.id ?? 'babok');
      } catch (error) {
        if (!cancelled) setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load model routing.' });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const previewContext = useMemo(() => ({
    availableProviders: catalog?.providers.filter((provider) => provider.configured).map((provider) => provider.id) ?? [],
    preferredProvider: catalog?.preferredProvider ?? null,
    defaultModels: Object.fromEntries((catalog?.providers ?? []).map((provider) => [provider.id, provider.defaultModel])),
  }), [catalog]);
  const providerNames = useMemo(
    () => Object.fromEntries((catalog?.providers ?? []).map((provider) => [provider.id, provider.name])),
    [catalog],
  );
  const configuredCount = previewContext.availableProviders.length;

  function change(next: ModelRouting) {
    setRouting(next);
    setDirty(true);
    setMessage(null);
  }

  function updateProfile(profileId: string, updater: (profile: ModelRouting['profiles'][string]) => ModelRouting['profiles'][string]) {
    const current = routing.profiles[profileId] ?? { default: {}, stages: {} };
    change({ ...routing, profiles: { ...routing.profiles, [profileId]: updater(current) } });
  }

  function summary(profileId: string | null, stage: number | null) {
    const preview = previewModelRoute(routing, profileId, stage, previewContext);
    if (preview.candidates.length === 0) {
      return <span className="text-amber-700 dark:text-amber-300">No configured provider — add an API key above.</span>;
    }
    const [primary, ...rest] = preview.candidates;
    return (
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold text-slate-700 dark:text-slate-200">Effective:</span>
        <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          {`${providerNames[primary.provider] ?? primary.provider} · ${primary.model}`}
        </span>
        <span>({SOURCE_LABELS[primary.source]})</span>
        <span>· temperature {preview.temperature ?? 'default'}{preview.temperature !== null ? ` (${SOURCE_LABELS[preview.temperatureSource]})` : ''}</span>
        <span>· effort {preview.effort ?? 'default'}{preview.effort !== null ? ` (${SOURCE_LABELS[preview.effortSource]})` : ''}</span>
        {rest.length ? (
          <span>· then {rest.map((candidate) => `${candidate.provider}/${candidate.model}`).join(' → ')}</span>
        ) : null}
        {preview.skipped.length ? (
          <span className="text-amber-700 dark:text-amber-300">
            · skipped (no key): {preview.skipped.map((candidate) => `${candidate.provider}/${candidate.model}`).join(', ')}
          </span>
        ) : null}
      </span>
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/settings/ai/routing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routing }),
      });
      const body = (await response.json().catch(() => null)) as (ModelRoutingState & { error?: string }) | null;
      if (!response.ok || !body?.routing) throw new Error(body?.error ?? `Saving routing failed with status ${response.status}`);
      setState(body);
      setRouting(body.routing);
      setDirty(false);
      setMessage({ type: 'success', text: 'Model routing saved. New interview turns and drafts use it immediately.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to save model routing.' });
    } finally {
      setSaving(false);
    }
  }

  const profiles: RoutingProfileSummary[] = state?.profiles ?? [];
  const profile = profiles.find((entry) => entry.id === activeProfile);
  const profileRouting = routing.profiles[activeProfile] ?? { default: {}, stages: {} };
  const effortLevels = state?.effortLevels ?? ['minimal', 'low', 'medium', 'high'];

  return (
    <div className="space-y-6">
      <section className="card-base p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Available models</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Models accessible with each configured credential. OpenAI, Anthropic and Gemini are queried live from the provider API.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => void loadCatalog()} disabled={catalogLoading} className={secondaryButton}>
            {catalogLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh models
          </button>
        </div>

        {catalogError ? (
          <p className="mt-4 text-sm text-red-700 dark:text-red-300">{catalogError}</p>
        ) : null}
        {catalog && configuredCount === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No provider is configured yet. Save an API key above to list its models.</p>
        ) : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {catalog?.providers.filter((provider) => provider.configured).map((provider) => (
            <details key={provider.id} className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800" open={provider.models.length <= 12}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                {provider.name}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {provider.models.length} models
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${provider.source === 'api'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : provider.source === 'fallback'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
                >
                  {provider.source === 'api' ? 'Live from API key' : provider.source === 'fallback' ? 'Built-in list (API check failed)' : 'Built-in list'}
                </span>
              </summary>
              {provider.error ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{provider.error}</p> : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {provider.models.map((model) => (
                  <span key={model} className={`rounded-lg px-2 py-1 font-mono text-xs ${model === provider.defaultModel
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}
                  >
                    {model}
                  </span>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="card-base p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Advanced model routing</h2>
              <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                Route interviews and draft generation per pipeline profile and per stage. The most specific level wins:
                stage → profile default → global default → active provider. Leave a field empty to inherit it.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !dirty || !state}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save routing
          </button>
        </div>

        {message ? (
          <div className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${message.type === 'error'
            ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300'
            : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-500/10 dark:text-emerald-300'}`}
          >
            {message.type === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        ) : null}

        {!state ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading routing…</div>
        ) : (
          <div className="mt-6 space-y-6">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 p-4 text-sm dark:border-slate-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={routing.failover_all_providers}
                onChange={(event) => change({ ...routing, failover_all_providers: event.target.checked })}
              />
              <span>
                <span className="font-semibold text-slate-900 dark:text-white">Fail over across every configured API key</span>
                <span className="block text-slate-600 dark:text-slate-400">
                  After the routed model and its explicit fallbacks, try every other configured provider ({configuredCount} configured)
                  with its default model before failing the request.
                </span>
              </span>
            </label>

            <RuleEditor
              idPrefix="route-global"
              title="Global default"
              subtitle="Applies to every profile and stage"
              rule={routing.default}
              onChange={(rule) => change({ ...routing, default: rule })}
              catalog={catalog}
              effortLevels={effortLevels}
              inheritLabel={null}
              summary={summary(null, null)}
            />

            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Layers className="h-4 w-4 text-slate-400" />
                {profiles.map((entry) => {
                  const overrides = Object.keys(routing.profiles[entry.id]?.stages ?? {}).length
                    + (Object.keys(routing.profiles[entry.id]?.default ?? {}).length ? 1 : 0);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setActiveProfile(entry.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${entry.id === activeProfile
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {PROFILE_LABELS[entry.id] ?? entry.name}
                      {overrides ? <span className="ml-1.5 text-xs opacity-80">({overrides})</span> : null}
                    </button>
                  );
                })}
              </div>

              {profile ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{profile.name}</p>
                  <RuleEditor
                    key={`${profile.id}-default`}
                    idPrefix={`route-${profile.id}-default`}
                    title="Profile default"
                    subtitle={`All ${PROFILE_LABELS[profile.id] ?? profile.name} stages`}
                    rule={profileRouting.default}
                    onChange={(rule) => updateProfile(profile.id, (current) => ({ ...current, default: rule }))}
                    catalog={catalog}
                    effortLevels={effortLevels}
                    inheritLabel="Inherit (global default)"
                    summary={summary(profile.id, null)}
                  />
                  {profile.stages.map((stage) => (
                    <RuleEditor
                      key={`${profile.id}-${stage.stage}`}
                      idPrefix={`route-${profile.id}-${stage.stage}`}
                      title={`Stage ${stage.stage}`}
                      subtitle={stage.name}
                      rule={profileRouting.stages[String(stage.stage)] ?? {}}
                      onChange={(rule) => updateProfile(profile.id, (current) => {
                        const stages = { ...current.stages };
                        if (Object.keys(rule).length) stages[String(stage.stage)] = rule;
                        else delete stages[String(stage.stage)];
                        return { ...current, stages };
                      })}
                      catalog={catalog}
                      effortLevels={effortLevels}
                      inheritLabel="Inherit (profile default)"
                      summary={summary(profile.id, stage.stage)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
