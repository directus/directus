import { expect, test } from 'vitest';
import { toMilliseconds } from './to-milliseconds.js';

test.each([
	['15m', 900_000],
	['7d', 604_800_000],
	['7500ms', 7500],
	['5000', 5000],
	['0', 0],
	[5000, 5000],
])('Parses %j into %j', (value, expected) => {
	expect(toMilliseconds(value)).toBe(expected);
});

test.each([[''], ['not a duration'], [undefined], [null], [true], [{}]])('Returns undefined for %j', (value) => {
	expect(toMilliseconds(value)).toBeUndefined();
});
