import { test, expect } from 'vitest';
import { mapValuesDeep } from './map-values-deep.js';

test('Replace all undefined values with null', () => {
	const obj = { a: { b: { c: undefined } }, b: 'test' };
	const result = mapValuesDeep(obj, (_, value) => (value === undefined ? null : value));
	expect(result).toEqual({ a: { b: { c: null } }, b: 'test' });
});

test('Set all values to "Hi" with a key of "b.c"', () => {
	const obj = { a: { b: { c: undefined } }, b: { a: 'test', c: 'test' }, 'b.c': 'test' };
	const result = mapValuesDeep(obj, (key, value) => (key === 'b.c' ? 'Hi' : value));
	expect(result).toEqual({ a: { b: { c: undefined } }, b: { a: 'test', c: 'Hi' }, 'b.c': 'Hi' });
});

test('Make sure arrays are propperly mapped', () => {
	const obj = { a: [undefined, 'test'] };
	const result = mapValuesDeep(obj, (_, value) => (value === undefined ? null : value));
	expect(result).toEqual({ a: [null, 'test'] });
});

test('Set all 2nd indices of arrays to "Hi"', () => {
	const obj = { a: [undefined, 'test', { a: ['hello', 'world'] }], b: ['test'] };
	const result = mapValuesDeep(obj, (key, value) => (key.endsWith('a[1]') ? 'Hi' : value));
	expect(result).toEqual({ a: [undefined, 'Hi', { a: ['hello', 'Hi'] }], b: ['test'] });
});
