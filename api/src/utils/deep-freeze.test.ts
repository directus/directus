import { describe, expect, test } from 'vitest';
import { deepFreeze } from './deep-freeze.js';

const PRIMITIVE_INPUTS = [
	{ input: 123 },
	{ input: 'abc' },
	{ input: null },
	{ input: undefined },
	{ input: true },
	{ input: false },
];

const NESTED_STRUCTURE = { a: { b: [1, { c: 2 }] } };

const FROZEN_PATHS = [
	{ label: 'root', extract: (o: typeof NESTED_STRUCTURE) => o },
	{ label: 'a', extract: (o: typeof NESTED_STRUCTURE) => o.a },
	{ label: 'a.b', extract: (o: typeof NESTED_STRUCTURE) => o.a.b },
	{ label: 'a.b[1]', extract: (o: typeof NESTED_STRUCTURE) => o.a.b[1] },
];

const NON_PLAIN_VALUES = [
	{ label: 'Date', value: new Date() },
	{ label: 'Map', value: new Map() },
	{ label: 'Set', value: new Set() },
];

describe('deepFreeze', () => {
	test.each(PRIMITIVE_INPUTS)('returns primitive $input unchanged', ({ input }) => {
		expect(deepFreeze(input)).toBe(input);
	});

	test('returns the same reference for objects (mutates in place)', () => {
		const input = { a: 1 };
		expect(deepFreeze(input)).toBe(input);
	});

	describe('freezes every nested array and plain object', () => {
		const frozen = deepFreeze(structuredClone(NESTED_STRUCTURE));

		test.each(FROZEN_PATHS)('$label is frozen', ({ extract }) => {
			expect(Object.isFrozen(extract(frozen))).toBe(true);
		});
	});

	test.each(NON_PLAIN_VALUES)('leaves $label values unfrozen', ({ value }) => {
		deepFreeze({ value });
		expect(Object.isFrozen(value)).toBe(false);
	});
});
