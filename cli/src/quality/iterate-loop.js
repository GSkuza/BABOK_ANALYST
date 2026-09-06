/**
 * Generic bounded score -> improve -> rescore loop. Pure: no file/journal I/O,
 * no provider-specific code. Callers (quality-loop.js, staged-generator.js)
 * wrap side effects (persistence, journal updates) around this via `onIteration`.
 */

/**
 * @param {string} content
 * @param {{
 *   scoreFn: (content: string, iteration: number) => Promise<{ overall?: number, [key: string]: any }|null>,
 *   reviseFn: (content: string, scoreObj: object|null, iteration: number) => Promise<string>,
 *   maxIterations?: number,
 *   threshold?: number,
 *   defaultScore?: number,
 *   onIteration?: (event: { iteration: number, content: string, score: number, scoreObj: object|null, escalated: boolean }) => void,
 * }} options
 * @returns {Promise<{ content: string, finalScore: number, finalScoreObj: object|null, iterations: number, passed: boolean, escalated: boolean }>}
 */
export async function iterateUntilThreshold(content, options) {
  const {
    scoreFn,
    reviseFn,
    maxIterations = 3,
    threshold = 75,
    defaultScore = 50,
    onIteration,
  } = options;

  let current = content;
  let finalScore = 0;
  let finalScoreObj = null;
  let passed = false;
  let iteration = 0;

  for (iteration = 1; iteration <= maxIterations; iteration++) {
    const scoreObj = await scoreFn(current, iteration);
    finalScoreObj = scoreObj;
    finalScore = scoreObj?.overall ?? defaultScore;

    onIteration?.({ iteration, content: current, score: finalScore, scoreObj, escalated: false });

    if (finalScore >= threshold) {
      passed = true;
      break;
    }

    if (iteration < maxIterations) {
      current = await reviseFn(current, scoreObj, iteration);
    }
  }

  const iterationsUsed = Math.min(iteration, maxIterations);
  const escalated = !passed;
  if (escalated) {
    onIteration?.({ iteration: iterationsUsed, content: current, score: finalScore, scoreObj: finalScoreObj, escalated: true });
  }

  return {
    content: current,
    finalScore,
    finalScoreObj,
    iterations: iterationsUsed,
    passed,
    escalated,
  };
}
