import { getRandomWaitTime } from './get-random-wait-time.js';
import { expect, test } from 'vitest';

test('Returns a random number between 0 and 1.8e+6', () => {
	const results = Array.from({ length: 500 }, () => getRandomWaitTime());
	expect(results.every((res) => res < 1.8e6 && res >= 0)).toBe(true);
});
