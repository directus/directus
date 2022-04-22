import { performance } from 'perf_hooks';

/**
 * Wait a specific time to meet the stall ms. Useful in cases where you need to make sure that every
 * path in a function takes at least X ms (for example authenticate).
 *
 * @param {number} ms - Stall time to wait until
 * @param {number} start - Current start time of the function
 *
 * @example
 *
 * ```js
 * const STALL_TIME = 100;
 *
 * // Function will always take (at least) 100ms
 * async function doSomething() {
 *   const timeStart = performance.now();
 *
 *   if (something === true) {
 *     await heavy();
 *   }
 *
 *   stall(STALL_TIME, timeStart);
 *   return 'result';
 * }
 * ```
 */
export async function stall(ms: number, start: number): Promise<void> {
	const now = performance.now();
	const timeElapsed = now - start;
	const timeRemaining = ms - timeElapsed;

	if (timeRemaining <= 0) return;

	return new Promise((resolve) => setTimeout(resolve, timeRemaining));
}
