import { createLlmClient, getApiKey, PROVIDERS } from './llm.js';
import { createHfTaskClient } from './llm-tasks.js';

const DEEP_STAGES = new Set([3, 4, 6, 8]);

const DEFAULT_ROUTING = {
  routing_policy: 'cost_aware',
  tasks: {
    generate_deliverable: {
      standard: { provider: 'gemini', model: 'gemini-2.0-flash' },
      deep: { provider: 'anthropic', model: 'claude-sonnet-5' },
    },
    classify: {
      provider: 'huggingface',
      task: 'zero-shot-classification',
      model: 'facebook/bart-large-mnli',
    },
    score_quality: {
      provider: 'openai',
      model: 'gpt-5.6-luna',
    },
    verify_claim: {
      provider: 'huggingface',
      task: 'zero-shot-classification',
      model: 'facebook/bart-large-mnli',
    },
    summarize_context: {
      provider: 'huggingface',
      task: 'summarization',
      model: 'facebook/bart-large-cnn',
    },
  },
  fallback_chain: ['openai', 'anthropic', 'gemini'],
};

function parseJsonObject(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) return null;
  try {
    return JSON.parse(objMatch[0]);
  } catch {
    return null;
  }
}

function pickBestLabel(classificationResult, labels) {
  const outLabels = classificationResult?.labels || [];
  const outScores = classificationResult?.scores || [];
  if (!outLabels.length || !outScores.length) {
    return { label: labels[0], score: 0 };
  }

  let bestIdx = 0;
  for (let i = 1; i < outScores.length; i++) {
    if (outScores[i] > outScores[bestIdx]) bestIdx = i;
  }
  return { label: outLabels[bestIdx], score: outScores[bestIdx] };
}

export function createTaskRouter(options = {}) {
  const primaryProvider = options.primaryProvider;
  const primaryApiKey = options.primaryApiKey;
  const primaryModel = options.primaryModel;

  const deepProvider = options.deepProvider || primaryProvider;
  const deepApiKey = options.deepApiKey || primaryApiKey;
  const deepModel = options.deepModel;

  const routing = {
    ...DEFAULT_ROUTING,
    ...(options.routingConfig || {}),
    tasks: {
      ...DEFAULT_ROUTING.tasks,
      ...(options.routingConfig?.tasks || {}),
    },
  };

  const chatClientCache = new Map();
  const hfTaskClientCache = new Map();

  const getProviderApiKey = (provider) => {
    if (provider === primaryProvider) return primaryApiKey;
    if (provider === deepProvider && deepApiKey) return deepApiKey;
    return getApiKey(provider);
  };

  const getChatClient = (provider, model) => {
    const key = `${provider}::${model || ''}`;
    if (chatClientCache.has(key)) return chatClientCache.get(key);

    const apiKey = getProviderApiKey(provider);
    if (!apiKey) return null;
    const client = createLlmClient(provider, apiKey, model || PROVIDERS[provider]?.defaultModel);
    chatClientCache.set(key, client);
    return client;
  };

  const getHfTaskClient = (provider = 'huggingface') => {
    if (hfTaskClientCache.has(provider)) return hfTaskClientCache.get(provider);
    const apiKey = getProviderApiKey(provider);
    if (!apiKey) return null;
    const client = createHfTaskClient(apiKey);
    hfTaskClientCache.set(provider, client);
    return client;
  };

  const resolveGenerateConfig = (stageNumber) => {
    const taskCfg = routing.tasks.generate_deliverable || {};
    const deep = DEEP_STAGES.has(stageNumber);
    const cfg = deep ? (taskCfg.deep || {}) : (taskCfg.standard || {});

    // Primary/deep provider from CLI always wins if configured and key exists.
    if (deep && deepProvider && deepApiKey) {
      return { provider: deepProvider, model: deepModel || cfg.model };
    }
    if (!deep && primaryProvider && primaryApiKey) {
      return { provider: primaryProvider, model: primaryModel || cfg.model };
    }
    return cfg;
  };

  const withFallbackChat = async (preferredProvider, preferredModel, systemPrompt, userPrompt) => {
    const providersToTry = [
      preferredProvider,
      ...(routing.fallback_chain || []),
      primaryProvider,
    ].filter(Boolean);

    const seen = new Set();
    for (const provider of providersToTry) {
      if (seen.has(provider)) continue;
      seen.add(provider);

      const model = provider === preferredProvider
        ? preferredModel
        : (provider === primaryProvider ? primaryModel : undefined);
      const client = getChatClient(provider, model);
      if (!client) continue;

      try {
        return await client.chat(systemPrompt, userPrompt);
      } catch {
        // Try next provider in fallback chain.
      }
    }
    throw new Error('No available provider could handle the request.');
  };

  const summarizeContext = async (text) => {
    if (!text || text.length <= 2000) return text;
    const cfg = routing.tasks.summarize_context || {};

    if (cfg.provider === 'huggingface') {
      const hf = getHfTaskClient('huggingface');
      if (hf) {
        try {
          const out = await hf.summarize(text, cfg.model);
          if (typeof out?.summary_text === 'string' && out.summary_text.trim()) {
            return out.summary_text.trim();
          }
        } catch {
          // fall through to chat fallback
        }
      }
    }

    const prompt =
      'Summarize the following BABOK stage output for downstream stages. Preserve numeric targets, FR/NFR IDs, budget values, dates, KPI names, and key risks. Return plain text summary, max 500 words.';

    return withFallbackChat(cfg.provider || primaryProvider, cfg.model, prompt, text);
  };

  const classify = async (text, labels, taskType = 'classify') => {
    const cfg = routing.tasks[taskType] || routing.tasks.classify || {};
    if (cfg.provider === 'huggingface') {
      const hf = getHfTaskClient('huggingface');
      if (hf) {
        try {
          const raw = await hf.classify(text, labels, cfg.model);
          return pickBestLabel(raw, labels);
        } catch {
          // fall through to chat fallback
        }
      }
    }

    const systemPrompt =
      'You are a strict classifier. Return ONLY one label from the provided label set. No explanation.';
    const userPrompt = `Labels: ${labels.join(', ')}\n\nText:\n${text}`;
    const raw = await withFallbackChat(cfg.provider || primaryProvider, cfg.model, systemPrompt, userPrompt);
    const upper = raw.trim().toUpperCase();
    const matched = labels.find((l) => upper.includes(l.toUpperCase())) || labels[0];
    return { label: matched, score: 0.5 };
  };

  const classifyVerdict = async ({ context, analysis, question }) => {
    const labels = ['CONFIRMED', 'UNCERTAIN', 'REFUTED'];
    const text =
      `PROJECT CONTEXT:\n${context}\n\nANALYSIS:\n${analysis}\n\nQUESTION:\n${question}`;
    return classify(text, labels, 'verify_claim');
  };

  const scoreQuality = async ({ stageNumber, artefact }) => {
    const cfg = routing.tasks.score_quality || {};
    const system =
      'Return ONLY valid JSON object with keys overall, completeness, consistency, quality, improvements. ' +
      'Each numeric score in range 0-100. improvements must be an array of short strings.';
    const user =
      `Score BABOK Stage ${stageNumber} artefact.\n` +
      'JSON schema: {"overall":number,"completeness":number,"consistency":number,"quality":number,"improvements":string[]}\n\n' +
      `ARTEFACT:\n${artefact}`;

    const raw = await withFallbackChat(cfg.provider || primaryProvider, cfg.model, system, user);
    const parsed = parseJsonObject(raw);
    if (!parsed) {
      throw new Error('scoreQuality: failed to parse JSON response from model');
    }
    return parsed;
  };

  const getStageClient = (stageNumber) => {
    const cfg = resolveGenerateConfig(stageNumber);
    const client = getChatClient(cfg.provider || primaryProvider, cfg.model || primaryModel);
    if (!client) {
      throw new Error(`No available model client for stage ${stageNumber}. Check provider API keys.`);
    }

    return {
      ...client,
      summarizeContext,
      classify,
      classifyVerdict,
      scoreQuality,
      providerName: client.providerName,
      modelName: client.modelName,
    };
  };

  return {
    getStageClient,
    summarizeContext,
    classify,
    classifyVerdict,
    scoreQuality,
    routing,
  };
}
