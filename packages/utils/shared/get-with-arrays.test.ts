import { expect, test } from 'vitest';
import { get } from './get-with-arrays.js';

test('Returns static value', () => {
	const input = { test: { path: 'example' } };
	expect(get(input, 'test.path')).toBe('example');
});

test('Returns static array', () => {
	const input = { test: [] };
	expect(get(input, 'test')).toEqual([]);
});

test('Returns default value if path inside object does not exist', () => {
	const input = { test: { path: 'example' } };
	expect(get(input, 'test.wrong', 'default value')).toBe('default value');
});

test('Returns default value if path inside array does not exist', () => {
	const input = { test: [{ path: 'example' }] };
	expect(get(input, 'test.wrong', 'default value')).toEqual('default value');
});

test('Returns values in array path as flattened array', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(get(input, 'test.path')).toEqual(['example', 'another']);
});

test('Returns values in array path as flattened array', () => {
	const input = { test: [{ path: 'example' }, { falsePath: 'another' }] };
	expect(get(input, 'test:collection.path')).toEqual(['example']);
});

test('Returns values in multi-array path as flattened array', () => {
	const input = { test: [{ path: [{ test: 'example' }, { falsePath: 'another' }] }, { falsePath: 'falseAnother' }] };
	expect(get(input, 'test.path.test')).toEqual(['example']);
});

test('Returns values spread across multiple places in multi-array path as flattened array', () => {
	const input = { test: [{ path: [{ test: 'example' }, { test: 'example2' }] }, { path: [{ test: 'another' }] }] };
	expect(get(input, 'test.path.test')).toEqual(['example', 'example2', 'another']);
});

test('Returns falsy values in array path', () => {
	const input = { test: [{ path: 0 }, { path: false }, { path: '' }, { falsePath: 'example' }] };
	expect(get(input, 'test.path')).toEqual([0, false, '']);
});

test('Excludes only null and undefined in array path', () => {
	const input = { test: [{ path: null }, { path: undefined }, { path: 0 }] };
	expect(get(input, 'test.path')).toEqual([0]);
});

test('Keeps an all-falsy array instead of falling back to the default', () => {
	const input = { test: [{ path: 0 }, { path: false }] };
	expect(get(input, 'test.path', 'default value')).toEqual([0, false]);
});
