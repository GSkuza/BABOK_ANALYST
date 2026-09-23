import type { ModelRouting, ModelRoutingRule, ModelTarget } from './ai-settings';

export type RouteSource = 'stage' | 'profile' | 'global' | 'active_provider' | 'fallback' | 'failover_all' | 'provider_default';

export interface RouteCandidatePreview {
  provider: string;
  model: string;
  source: RouteSource;
}

export interface RoutePreview {
  temperature: number | null;
  effort: string | null;
  temperatureSource: RouteSource;
  effortSource: RouteSource;
  candidates: RouteCandidatePreview[];
  skipped: RouteCandidatePreview[];
}

interface PreviewContext {
  availableProviders: string[];
  preferredProvider: string | null;
  defaultModels: Record<string, string>;
}

/**
 * Client-side mirror of `resolveModelRoute` in cli/src/model-routing.js, used
 * to show the effective route of every level before the routing is saved.
 */
export function previewModelRoute(
  routing: ModelRouting,
  profileId: string | null,
  stage: number | null,
  context: PreviewContext,
): RoutePreview {
  const profile = profileId ? routing.profiles[profileId] : undefined;
  const levels: Array<{ source: RouteSource; rule: ModelRoutingRule }> = [];
  if (profile && stage !== null && profile.stages[String(stage)]) {
    levels.push({ source: 'stage', rule: profile.stages[String(stage)] });
  }
  if (profile) levels.push({ source: 'profile', rule: profile.default ?? {} });
  levels.push({ source: 'global', rule: routing.default ?? {} });

  const available = context.availableProviders;
  const preferred = context.preferredProvider && available.includes(context.preferredProvider)
    ? context.preferredProvider
    : available[0] ?? null;
  const defaultModel = (provider: string) => context.defaultModels[provider] ?? '';

  const first = <K extends keyof ModelRoutingRule>(field: K) => {
    for (const level of levels) {
      const value = level.rule[field];
      if (value !== undefined && value !== null) return { value, source: level.source };
    }
    return { value: null, source: 'provider_default' as RouteSource };
  };

  const target = levels.find((level) => level.rule.provider);
  const planned: RouteCandidatePreview[] = [];
  const seen = new Set<string>();
  const push = (entry: ModelTarget | null, source: RouteSource) => {
    if (!entry?.provider) return;
    const model = entry.model || defaultModel(entry.provider);
    const key = `${entry.provider}::${model}`;
    if (seen.has(key)) return;
    seen.add(key);
    planned.push({ provider: entry.provider, model, source });
  };
  if (target) push({ provider: target.rule.provider!, model: target.rule.model }, target.source);
  else if (preferred) push({ provider: preferred }, 'active_provider');
  for (const entry of (first('fallbacks').value as ModelTarget[] | null) ?? []) push(entry, 'fallback');
  if (routing.failover_all_providers) {
    const covered = new Set(planned.map((candidate) => candidate.provider));
    for (const provider of available) if (!covered.has(provider)) push({ provider }, 'failover_all');
  }

  const candidates = planned.filter((candidate) => available.includes(candidate.provider));
  const skipped = planned.filter((candidate) => !available.includes(candidate.provider));
  if (candidates.length === 0 && preferred) {
    candidates.push({ provider: preferred, model: defaultModel(preferred), source: 'active_provider' });
  }
  const temperature = first('temperature');
  const effort = first('effort');
  return {
    temperature: temperature.value as number | null,
    effort: effort.value as string | null,
    temperatureSource: temperature.source,
    effortSource: effort.source,
    candidates,
    skipped,
  };
}
