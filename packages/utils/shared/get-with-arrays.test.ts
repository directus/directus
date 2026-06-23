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

test('Indexes into an array with bracket notation', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(get(input, 'test[0].path')).toBe('example');
	expect(get(input, 'test[1].path')).toBe('another');
});

test('Indexes into an array with dot notation', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(get(input, 'test.0.path')).toBe('example');
	expect(get(input, 'test.1.path')).toBe('another');
});

test('Returns the indexed array entry itself', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(get(input, 'test[0]')).toEqual({ path: 'example' });
});

test('Returns default value if array index is out of range', () => {
	const input = { test: [{ path: 'example' }] };
	expect(get(input, 'test[5].path', 'default value')).toBe('default value');
});

test('Indexes into a nested array', () => {
	const input = { test: [{ path: [{ test: 'a' }, { test: 'b' }] }] };
	expect(get(input, 'test[0].path[1].test')).toBe('b');
});

test('Still spreads non-indexed array paths when mixed with indexing', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	// Without an index the values are still spread across every entry
	expect(get(input, 'test.path')).toEqual(['example', 'another']);
});
