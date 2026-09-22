'use client';

import { useState } from 'react';
import { AlertCircle, Check, ExternalLink, KeyRound, LoaderCircle, Star, Trash2 } from 'lucide-react';
import type { AiProviderSetting, AiSettings } from '@/lib/ai-settings';

interface Props {
  initialSettings: AiSettings;
}

export function AiSettingsPanel({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [busyProvider, setBusyProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  async function update(
    provider: AiProviderSetting,
    method: 'POST' | 'DELETE',
    payload: Record<string, unknown>,
  ) {
    setBusyProvider(provider.id);
    setError(null);
    setSavedProvider(null);
    try {
      const response = await fetch('/api/settings/ai', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: provider.id, ...payload }),
      });
      const body = (await response.json().catch(() => null)) as (AiSettings & { error?: string }) | null;
      if (!response.ok || !body?.providers) {
        throw new Error(body?.error ?? `Settings request failed with status ${response.status}`);
      }
      setSettings(body);
      setSecrets((current) => ({ ...current, [provider.id]: '' }));
      setSavedProvider(provider.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update AI settings.');
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {settings.providers.map((provider) => {
          const busy = busyProvider === provider.id;
          const label = provider.configType === 'vertex' ? 'Vertex project configuration' : 'API key';
          return (
            <section key={provider.id} className="card-base p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{provider.name}</h2>
                    {provider.preferred ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                        <Star className="h-3 w-3" />
                        Active
                      </span>
                    ) : null}
                    {provider.configured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Check className="h-3 w-3" />
                        Configured
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={provider.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Get credentials
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <KeyRound className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                <label htmlFor={`secret-${provider.id}`} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {label}
                </label>
                {provider.configured && !provider.stored ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configured through an environment variable or .env file. That value takes precedence over this form.
                  </p>
                ) : null}
                <input
                  id={`secret-${provider.id}`}
                  type="password"
                  value={secrets[provider.id] ?? ''}
                  onChange={(event) => setSecrets((current) => ({ ...current, [provider.id]: event.target.value }))}
                  placeholder={provider.configured ? 'Enter a new value to replace the current one' : `Enter ${label.toLowerCase()}`}
                  autoComplete="new-password"
                  disabled={busy}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-500/10"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !(secrets[provider.id] ?? '').trim()}
                    onClick={() => update(provider, 'POST', { secret: secrets[provider.id] ?? '' })}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                    Save and use
                  </button>
                  {provider.configured && !provider.preferred ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => update(provider, 'POST', { action: 'prefer' })}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Star className="h-4 w-4" />
                      Use as active
                    </button>
                  ) : null}
                  {provider.stored ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => update(provider, 'DELETE', {})}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  ) : null}
                </div>
                {savedProvider === provider.id ? (
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Settings updated.</p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
