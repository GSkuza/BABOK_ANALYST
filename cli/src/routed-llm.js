/**
 * Routed LLM client: executes a resolved model route (see model-routing.js)
 * by trying each provider/model candidate in order, with the route's
 * temperature and reasoning effort, failing over to the next configured API
 * key when a provider, model or quota fails.
 */
import {
  createLlmClient,
  getApiKey,
  getPreferredProvider,
  LlmRequestAbortError,
  LlmRequestTimeoutError,
  PROVIDERS,
} from './llm.js';
import { hasModelRoutingRules, readModelRouting, resolveModelRoute } from './model-routing.js';

export function listConfiguredProviders(getKey = getApiKey) {
  return Object.keys(PROVIDERS).filter(provider => getKey(provider));
}

/**
 * Resolve the route for a profile stage against the providers that currently
 * have credentials. Reads `.babok_model_routing.json` unless `routing` is given.
 */
export function resolveConfiguredRoute(options = {}) {
  const getKey = options.getKey || getApiKey;
  return resolveModelRoute(options.routing ?? readModelRouting(), {
    profile: options.profile,
    stage: Number.isInteger(options.stage) ? options.stage : null,
    availableProviders: options.availableProviders ?? listConfiguredProviders(getKey),
    preferredProvider: options.preferredProvider ?? getPreferredProvider(),
    providers: PROVIDERS,
  });
}

/**
 * Routing applies unless the user disabled it or chose provider/model explicitly.
 * Returns the routing document when active, otherwise null.
 */
export function activeModelRouting({ disabled = false, explicit = false, routing } = {}) {
  if (disabled || explicit) return null;
  const config = routing ?? readModelRouting();
  return hasModelRoutingRules(config) ? config : null;
}

/** Errors after which a request must not be replayed on another provider. */
export function isNonFailoverError(error) {
  return error instanceof LlmRequestAbortError
    || error instanceof LlmRequestTimeoutError
    || error?.partialOutputEmitted === true;
}

function describeError(error) {
  return String(error instanceof Error ? error.message : error).replace(/\s+/g, ' ').slice(0, 300);
}

/**
 * @param {{ candidates: Array<{provider: string, model: string, source?: string}>, temperature?: number|null, effort?: string|null }} route
 * @param {{ getKey?: Function, createClient?: Function, onFailover?: Function, sticky?: boolean, rejectEmpty?: boolean }} [options]
 *   sticky (default true): after a failover, later calls start from the candidate that worked.
 *   rejectEmpty (default true): a blank response fails over to the next candidate.
 */
export function createRoutedLlmClient(route, options = {}) {
  const candidates = route?.candidates || [];
  if (candidates.length === 0) {
    throw new Error('No configured LLM provider is available for this route. Configure an API key first (babok setup or Web AI Settings).');
  }
  const getKey = options.getKey || getApiKey;
  const createClient = options.createClient || createLlmClient;
  const sticky = options.sticky !== false;
  const rejectEmpty = options.rejectEmpty !== false;
  const generation = { temperature: route.temperature ?? null, effort: route.effort ?? null };
  const clients = new Map();
  const failovers = [];
  let activeIndex = 0;

  const clientFor = (candidate) => {
    const key = `${candidate.provider}::${candidate.model}`;
    if (!clients.has(key)) {
      clients.set(key, createClient(candidate.provider, getKey(candidate.provider), candidate.model, generation));
    }
    return clients.get(key);
  };

  const chat = async (systemPrompt, userMessage, arg3, arg4) => {
    const start = sticky ? activeIndex : 0;
    for (let index = start; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      try {
        const text = await clientFor(candidate).chat(systemPrompt, userMessage, arg3, arg4);
        if (rejectEmpty && !String(text ?? '').trim() && index < candidates.length - 1) {
          throw new Error('The model returned an empty response.');
        }
        activeIndex = index;
        return text;
      } catch (error) {
        if (isNonFailoverError(error) || index === candidates.length - 1) {
          if (failovers.length && error && typeof error === 'object') error.routeFailovers = [...failovers];
          throw error;
        }
        const failure = { provider: candidate.provider, model: candidate.model, error: describeError(error) };
        failovers.push(failure);
        options.onFailover?.(failure, candidates[index + 1]);
      }
    }
    throw new Error('No routed model candidate is available.');
  };

  const client = {
    chat,
    generation,
    route,
    candidates,
    failovers,
  };
  Object.defineProperties(client, {
    active: { enumerable: true, get: () => candidates[activeIndex] },
    providerId: { enumerable: true, get: () => candidates[activeIndex].provider },
    providerName: { enumerable: true, get: () => PROVIDERS[candidates[activeIndex].provider]?.name || candidates[activeIndex].provider },
    modelName: { enumerable: true, get: () => candidates[activeIndex].model },
  });
  return client;
}
