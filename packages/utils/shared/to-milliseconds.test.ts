import { expect, test } from 'vitest';
import { toMilliseconds } from './to-milliseconds.js';

test.each([
	['15m', 900_000],
	['7d', 604_800_000],
	['7500ms', 7500],
	['5000', 5000],
	['0', 0],
	['-1 minutes', -60_000],
	[5000, 5000],
	[0, 0],
	[-1, -1],
])('Parses %j into %j', (value, expected) => {
	expect(toMilliseconds(value)).toBe(expected);
});

test.each([[''], ['not a duration'], [undefined], [null], [true], [false], [[]], [{}], [Symbol('123')], [() => 456]])(
	'Returns undefined for %j',
	(value) => {
		expect(toMilliseconds(value)).toBeUndefined();
	},
);
