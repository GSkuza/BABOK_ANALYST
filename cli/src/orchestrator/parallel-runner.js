/**
 * Parallel Runner — runs multiple async tasks concurrently.
 * @param {Array<{ key: string, fn: () => Promise<any> }>} tasks
 * @returns {Promise<{ results: Object, errors: Object }>}
 */
export async function runParallel(tasks) {
  const settled = await Promise.allSettled(tasks.map(t => t.fn()));

  const results = {};
  const errors = {};

  settled.forEach((outcome, i) => {
    const key = tasks[i].key;
    if (outcome.status === 'fulfilled') {
      results[key] = outcome.value;
    } else {
      errors[key] = outcome.reason instanceof Error
        ? outcome.reason
        : new Error(String(outcome.reason));
    }
  });

  return { results, errors };
}
