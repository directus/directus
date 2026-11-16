import { expect, test } from 'vitest';
import { parseNumericString } from './parse-numeric-string.js';

test('parses integers and decimals', () => {
	expect(parseNumericString('42')).toBe(42);
	expect(parseNumericString('-42')).toBe(-42);
	expect(parseNumericString('3.14')).toBe(3.14);
});

test('parses integers beyond the safe range as BigInt', () => {
	expect(parseNumericString('9223372036854775807')).toBe(9223372036854775807n);
	expect(parseNumericString('-9223372036854775808')).toBe(-9223372036854775808n);
});

test('returns null for non-numeric strings', () => {
	expect(parseNumericString('abc')).toBeNull();
	expect(parseNumericString('Infinity')).toBeNull();
});

test('returns null for strings that only parse loosely', () => {
	expect(parseNumericString('')).toBeNull();
	expect(parseNumericString(' 42')).toBeNull();
	expect(parseNumericString('0b111')).toBeNull();
	expect(parseNumericString('1e3')).toBeNull();
	expect(parseNumericString('007')).toBeNull();
});

test('returns null for floats beyond the safe range', () => {
	expect(parseNumericString('9223372036854775807.5')).toBeNull();
});
