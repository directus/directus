import { guessType } from './guess-type.js';
import { describe, expect, test } from 'vitest';

describe('boolean', () => {
	test('Returns boolean if value is literal "true"', () => {
		expect(guessType('true')).toBe('boolean');
	});

	test('Returns boolean if value is literal "false"', () => {
		expect(guessType('true')).toBe('boolean');
	});

	test('Returns boolean if value is of type boolean', () => {
		expect(guessType(true)).toBe('boolean');
	});
});

describe('number', () => {
	test('Returns number for valid integers in strings', () => {
		expect(guessType('12345')).toBe('number');
	});

	test('Returns json for numbers starting with 0', () => {
		expect(guessType('0383312312')).toBe('json');
	});

	test('Returns json for strings starting with a number that are NaN', () => {
		expect(guessType('12notanumber')).toBe('json');
	});

	test('Returns json for numbers bigger than the max safe integer', () => {
		expect(guessType('9007199254740992')).toBe('json');
	});

	test('Returns json for numbers smaller than the min safe integer', () => {
		expect(guessType('-9007199254740992')).toBe('json');
	});

	test('Returns number for values of type number', () => {
		expect(guessType(12345)).toBe('number');
	});
});

describe('array', () => {
	test('Returns array for strings containing a comma', () => {
		expect(guessType('a,b,c')).toBe('array');
	});

	test('Returns array for values that are actual arrays', () => {
		expect(guessType(['a', 'b', 'c'])).toBe('array');
	});
});

describe('json', () => {
	test('Defaults to json for strings', () => {
		expect(guessType('hello')).toBe('json');
	});

	test('Defaults to json for object type values', () => {
		expect(guessType({ hello: 'world' })).toBe('json');
	});

	test('Defaults to json for empty string', () => {
		expect(guessType('')).toBe('json');
	});
});
