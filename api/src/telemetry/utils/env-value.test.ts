import { describe, expect, test } from 'vitest';
import { numberOrNull, stringOrNull } from './env-value.js';

describe('numberOrNull', () => {
	test.each([undefined, null, '', 'abc', {}])('returns null for %s', (value) => {
		expect(numberOrNull(value)).toBeNull();
	});

	test('coerces numeric strings and numbers', () => {
		expect(numberOrNull('25')).toBe(25);
		expect(numberOrNull(0)).toBe(0);
	});
});

describe('stringOrNull', () => {
	test.each([undefined, null, ''])('returns null for %s', (value) => {
		expect(stringOrNull(value)).toBeNull();
	});

	test('coerces to string', () => {
		expect(stringOrNull('50mb')).toBe('50mb');
		expect(stringOrNull(42)).toBe('42');
	});
});
