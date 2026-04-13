/**
 * Mock LLM client for tests.
 * Tracks all calls so tests can assert on them.
 */

/**
 * @param {Record<string, string|Function>} responses
 *   Key: prompt substring to match, Value: string response or function(prompt)=>string
 * @returns {{ chat: Function, calls: Array<{prompt: string, response: string}> }}
 */
export function createMockLlm(responses = {}) {
  const calls = [];

  async function chat(prompt, _options) {
    // Find matching response by substring key
    for (const [key, value] of Object.entries(responses)) {
      if (typeof prompt === 'string' && prompt.includes(key)) {
        const response = typeof value === 'function' ? value(prompt) : value;
        calls.push({ prompt, response });
        return response;
      }
    }

    // Default fallback
    const defaultResponse = responses['*'] || responses['default'] || 'Mock LLM response';
    const response =
      typeof defaultResponse === 'function' ? defaultResponse(prompt) : defaultResponse;
    calls.push({ prompt, response });
    return response;
  }

  async function complete(prompt, _options) {
    return chat(prompt, _options);
  }

  return {
    chat,
    complete,
    calls,
    /** Reset call history */
    reset() {
      calls.length = 0;
    },
  };
}
