import { expect, test } from 'vitest';
import { toBoolean } from './to-boolean.js';

test.each([
	[true, true],
	[false, false],
	[1, true],
	[0, false],
	['true', true],
	['TRUE', true],
	['True', true],
	[' true ', true],
	['1', true],
	['false', false],
	['FALSE', false],
	['False', false],
	['0', false],
])('Parses %j into %j', (value, expected) => {
	expect(toBoolean(value)).toBe(expected);
});

test.each([['HELLO'], ['yes'], [''], ['2'], [2], [null], [undefined], [{}]])('Returns undefined for %j', (value) => {
	expect(toBoolean(value)).toBeUndefined();
});
