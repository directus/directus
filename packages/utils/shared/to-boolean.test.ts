import { expect, test } from 'vitest';
import { toBoolean } from './to-boolean.js';

test.each([
	['true', true],
	[true, true],
	['1', true],
	[1, true],
	['false', false],
	['anything', false],
	[123, false],
	[{}, false],
	[['{}'], false],
])('toBoolean(%s) -> %s', (value, expected) => {
	expect(toBoolean(value)).toBe(expected);
});
