import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDERS,
  LLM_REQUEST_TIMEOUT_MS,
  createAnthropicTextResponse,
  createLlmClient,
  createOpenAITextResponse,
  discoverProviderModels,
  getRateLimitRetryDelayMs,
  streamAnthropicTextResponse,
  streamOpenAITextResponse,
} from '../../cli/src/llm.js';

describe('draft progress through the provider SDKs', () => {
  for (const provider of ['openai', 'anthropic']) {
    it(`${provider} does not retry a rejected drafting request`, async t => {
      let requests = 0;
      t.mock.method(globalThis, 'fetch', async () => {
        requests++;
        return new Response(JSON.stringify({ error: { type: 'rate_limit_error', message: 'Rate limit' } }),
          { status: 429, headers: { 'content-type': 'application/json' } });
      });
      const client = createLlmClient(provider, 'test-key');
      await assert.rejects(client.chat('System', 'Draft', () => {}));
      assert.equal(requests, 1);
    });
  }
  it('streams Gemini draft chunks through createLlmClient', async t => {
    let requestUrl;
    t.mock.method(globalThis, 'fetch', async url => {
      requestUrl = String(url);
      return new Response('data: ' + JSON.stringify({
        candidates: [{ index: 0, content: { role: 'model', parts: [{ text: 'Live draft' }] }, finishReason: 'STOP' }],
      }) + '\n\n', { headers: { 'content-type': 'text/event-stream' } });
    });
    const chunks = [];
    const client = createLlmClient('gemini', 'test-key');
    assert.equal(await client.chat('System', 'Draft', chunk => chunks.push(chunk)), 'Live draft');
    assert.match(requestUrl, /streamGenerateContent/);
    assert.deepEqual(chunks, ['Live draft']);
  });

  it('streams Anthropic draft chunks through createLlmClient', async t => {
    let request;
    const events = [
      { type: 'message_start', message: { id: 'test', type: 'message', role: 'assistant', model: 'test', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } },
      { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
      { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Live draft' } },
      { type: 'content_block_stop', index: 0 },
      { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } },
      { type: 'message_stop' },
    ];
    t.mock.method(globalThis, 'fetch', async (url, init) => {
      request = JSON.parse(init.body);
      return new Response(events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),
        { headers: { 'content-type': 'text/event-stream' } });
    });
    const chunks = [];
    const client = createLlmClient('anthropic', 'test-key');
    assert.equal(await client.chat('System', 'Draft', chunk => chunks.push(chunk)), 'Live draft');
    assert.equal(request.stream, true);
    assert.deepEqual(chunks, ['Live draft']);
  });
});

describe('rate-limit retry guidance', () => {
  it('uses the wait time included in a provider error', () => {
    assert.equal(getRateLimitRetryDelayMs({
      status: 429,
      message: 'Please try again in 16.593s.',
    }), 16593);
  });

  it('does not classify unrelated errors as rate limits', () => {
    assert.equal(getRateLimitRetryDelayMs({ status: 500, message: 'server error' }), null);
  });
});

describe('OpenAI model discovery', () => {
  it('uses the current recommended fallback models', () => {
    assert.equal(PROVIDERS.openai.defaultModel, 'gpt-5.6-terra');
    assert.deepEqual(PROVIDERS.openai.models, [
      'gpt-6-astra',
      'gpt-5.6',
      'gpt-5.6-terra',
      'gpt-5.6-luna',
    ]);
  });

  it('returns only text-generation models available to the API key', async () => {
    const client = {
      models: {
        list: async () => ({
          data: [
            { id: 'gpt-4o-mini-tts' },
            { id: 'gpt-5.6-luna' },
            { id: 'text-embedding-3-large' },
            { id: 'gpt-6-astra' },
            { id: 'o4-mini' },
            { id: 'gpt-5.6-codex' },
          ],
        }),
      },
    };

    const result = await discoverProviderModels('openai', 'test-key', { client });

    assert.equal(result.source, 'api');
    assert.equal(result.error, null);
    assert.deepEqual(result.models, ['gpt-6-astra', 'gpt-5.6-luna', 'o4-mini']);
  });

  it('falls back without hiding the API error', async () => {
    const expectedError = new Error('invalid_api_key');
    const client = { models: { list: async () => { throw expectedError; } } };

    const result = await discoverProviderModels('openai', 'bad-key', { client });

    assert.equal(result.source, 'fallback');
    assert.equal(result.error, expectedError);
    assert.deepEqual(result.models, PROVIDERS.openai.models);
  });

  it('does not call an API for registry-backed providers', async () => {
    const client = { models: { list: async () => { throw new Error('must not be called'); } } };
    const result = await discoverProviderModels('gemini', 'test-key', { client });

    assert.equal(result.source, 'registry');
    assert.deepEqual(result.models, PROVIDERS.gemini.models);
  });
});

describe('Anthropic model discovery', () => {
  it('uses the current Claude fallback models', () => {
    assert.equal(PROVIDERS.anthropic.defaultModel, 'claude-sonnet-5');
    assert.deepEqual(PROVIDERS.anthropic.models, [
      'claude-fable-5-1',
      'claude-opus-5',
      'claude-sonnet-5',
      'claude-haiku-4-5',
    ]);
  });

  it('returns Claude models available to the API key', async () => {
    let query;
    const client = {
      models: {
        list: async value => {
          query = value;
          return {
            data: [
              { id: 'claude-haiku-4-5' },
              { id: 'not-a-claude-model' },
              { id: 'claude-opus-5' },
              { id: 'claude-fable-5-1' },
            ],
          };
        },
      },
    };

    const result = await discoverProviderModels('anthropic', 'test-key', { client });

    assert.deepEqual(query, { limit: 1000 });
    assert.equal(result.source, 'api');
    assert.equal(result.error, null);
    assert.deepEqual(result.models, ['claude-fable-5-1', 'claude-opus-5', 'claude-haiku-4-5']);
  });

  it('falls back without hiding the Anthropic API error', async () => {
    const expectedError = new Error('authentication_error');
    const client = { models: { list: async () => { throw expectedError; } } };

    const result = await discoverProviderModels('anthropic', 'bad-key', { client });

    assert.equal(result.source, 'fallback');
    assert.equal(result.error, expectedError);
    assert.deepEqual(result.models, PROVIDERS.anthropic.models);
  });
});

describe('Anthropic Messages API', () => {
  it('creates a non-streaming response with a current Claude model', async () => {
    let request;
    const client = {
      messages: {
        create: async value => {
          request = value;
          return { content: [{ type: 'thinking', thinking: '...' }, { type: 'text', text: 'analysis result' }] };
        },
      },
    };
    const messages = [{ role: 'user', content: 'Analyze this process' }];

    const result = await createAnthropicTextResponse(client, 'claude-sonnet-5', 'System', messages);

    assert.equal(result, 'analysis result');
    assert.deepEqual(request, {
      model: 'claude-sonnet-5',
      system: 'System',
      messages,
      max_tokens: 8192,
    });
  });

  it('collects only text delta events from a Claude stream', async () => {
    async function* events() {
      yield { type: 'message_start' };
      yield { type: 'content_block_delta', delta: { type: 'thinking_delta', thinking: 'hidden' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Part 1' } };
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' + Part 2' } };
    }
    let request;
    const client = {
      messages: {
        stream: value => {
          request = value;
          return events();
        },
      },
    };
    const chunks = [];

    const result = await streamAnthropicTextResponse(
      client,
      'claude-opus-5',
      'System',
      [{ role: 'user', content: 'Analyze' }],
      chunk => chunks.push(chunk),
    );

    assert.equal(result, 'Part 1 + Part 2');
    assert.deepEqual(chunks, ['Part 1', ' + Part 2']);
    assert.equal(request.model, 'claude-opus-5');
    assert.equal(request.max_tokens, 8192);
    assert.equal('temperature' in request, false);
  });
});

describe('OpenAI Responses API', () => {
  for (const event of [
    { type: 'error', message: 'rate limited' },
    { type: 'response.failed', response: { error: { message: 'server error' } } },
    { type: 'response.incomplete', response: { incomplete_details: { reason: 'max_output_tokens' } } },
  ]) {
    it(`rejects ${event.type} instead of sending partial text to revision loops`, async () => {
      const client = { responses: { create: async () => (async function* () {
        yield { type: 'response.output_text.delta', delta: 'partial document' };
        yield event;
      })() } };
      await assert.rejects(streamOpenAITextResponse(client, 'test-model', []));
    });
  }

  it('creates a non-streaming text response with supported parameters', async () => {
    let request;
    let requestOptions;
    const client = {
      responses: {
        create: async (value, options) => {
          request = value;
          requestOptions = options;
          return { output_text: 'analysis result' };
        },
      },
    };
    const messages = [{ role: 'user', content: 'Analyze this process' }];

    const result = await createOpenAITextResponse(client, 'gpt-5.6-terra', messages);

    assert.equal(result, 'analysis result');
    assert.deepEqual(request, {
      model: 'gpt-5.6-terra',
      input: messages,
      max_output_tokens: 8192,
    });
    assert.deepEqual(requestOptions, { timeout: LLM_REQUEST_TIMEOUT_MS, maxRetries: 0 });
  });

  it('collects only output-text delta events from a stream', async () => {
    async function* events() {
      yield { type: 'response.created' };
      yield { type: 'response.output_text.delta', delta: 'Part 1' };
      yield { type: 'response.output_text.delta', delta: ' + Part 2' };
      yield { type: 'response.completed' };
    }
    let request;
    let requestOptions;
    const client = {
      responses: {
        create: async (value, options) => {
          request = value;
          requestOptions = options;
          return events();
        },
      },
    };
    const chunks = [];

    const result = await streamOpenAITextResponse(
      client,
      'gpt-6-astra',
      [{ role: 'user', content: 'Analyze' }],
      chunk => chunks.push(chunk),
    );

    assert.equal(result, 'Part 1 + Part 2');
    assert.deepEqual(chunks, ['Part 1', ' + Part 2']);
    assert.equal(request.stream, true);
    assert.equal(request.model, 'gpt-6-astra');
    assert.equal('temperature' in request, false);
    assert.deepEqual(requestOptions, { timeout: LLM_REQUEST_TIMEOUT_MS, maxRetries: 0 });
  });
});
