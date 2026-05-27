import { describe, expect, it } from 'vitest';
import { toArray } from './to-array.js';

describe('toArray', () => {
	it('returns the same array if already an array', () => {
		const input = [1, 2, 3];
		expect(toArray(input)).toBe(input);
	});

	it('wraps a single value in an array', () => {
		expect(toArray(1)).toEqual([1]);
	});

	it('wraps null in an array', () => {
		expect(toArray(null)).toEqual([null]);
	});

	it('wraps undefined in an array', () => {
		expect(toArray(undefined)).toEqual([undefined]);
	});

	it('wraps an object in an array', () => {
		const obj = { key: 'value' };
		expect(toArray(obj)).toEqual([obj]);
	});

	it('splits a comma-separated string into array', () => {
		expect(toArray('a,b,c')).toEqual(['a', 'b', 'c']);
	});

	it('splits a string with spaces around commas', () => {
		expect(toArray('a, b, c')).toEqual(['a', ' b', ' c']);
	});

	it('returns single-element array for string without commas', () => {
		expect(toArray('hello')).toEqual(['hello']);
	});

	it('handles empty string', () => {
		expect(toArray('')).toEqual(['']);
	});

	it('handles empty array', () => {
		expect(toArray([])).toEqual([]);
	});

	it('preserves array with mixed types', () => {
		const input = [1, 'two', { three: 3 }];
		expect(toArray(input)).toBe(input);
	});

	it('wraps boolean in an array', () => {
		expect(toArray(true)).toEqual([true]);
		expect(toArray(false)).toEqual([false]);
	});

	it('wraps number 0 in an array', () => {
		expect(toArray(0)).toEqual([0]);
	});
});
