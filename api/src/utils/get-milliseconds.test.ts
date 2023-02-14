import { expect, test } from 'vitest';
import getMilliseconds from './get-milliseconds';

test.each([
	// accept human readable time format and plain number
	['1d', 86400000],
	['1000', 1000],
	[1000, 1000],
	// accept negative values
	['-1 minutes', -60000],
	[-1, -1],
	// fallback to 0
	[0, 0],
	['', 0],
	['invalid string', 0],
	[false, 0],
	[[], 0],
	[{}, 0],
	[Symbol(123), 0],
	[
		() => {
			return 456;
		},
		0,
	],
])('input "%s" should result into %i', (input, expected) => {
	expect(getMilliseconds(input)).toBe(expected);
});
