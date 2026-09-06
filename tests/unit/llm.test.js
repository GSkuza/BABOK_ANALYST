import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROVIDERS,
  createAnthropicTextResponse,
  createOpenAITextResponse,
  discoverProviderModels,
  streamAnthropicTextResponse,
  streamOpenAITextResponse,
} from '../../cli/src/llm.js';

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
  it('creates a non-streaming text response with supported parameters', async () => {
    let request;
    const client = {
      responses: {
        create: async value => {
          request = value;
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
  });

  it('collects only output-text delta events from a stream', async () => {
    async function* events() {
      yield { type: 'response.created' };
      yield { type: 'response.output_text.delta', delta: 'Part 1' };
      yield { type: 'response.output_text.delta', delta: ' + Part 2' };
      yield { type: 'response.completed' };
    }
    let request;
    const client = {
      responses: {
        create: async value => {
          request = value;
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
  });
});