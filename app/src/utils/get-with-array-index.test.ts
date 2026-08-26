import { expect, test } from 'vitest';
import { getWithArrayIndex } from './get-with-array-index';

// Behaviour inherited from the shared `get` (spread / nested traversal) must be preserved, since the
// rendering layer relied on it before index support was added.
test('Returns static value', () => {
	const input = { test: { path: 'example' } };
	expect(getWithArrayIndex(input, 'test.path')).toBe('example');
});

test('Returns default value if path inside object does not exist', () => {
	const input = { test: { path: 'example' } };
	expect(getWithArrayIndex(input, 'test.wrong', 'default value')).toBe('default value');
});

test('Returns values in array path as flattened (spread) array', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(getWithArrayIndex(input, 'test.path')).toEqual(['example', 'another']);
});

test('Spreads across multi-array paths', () => {
	const input = { test: [{ path: [{ test: 'example' }, { test: 'example2' }] }, { path: [{ test: 'another' }] }] };
	expect(getWithArrayIndex(input, 'test.path.test')).toEqual(['example', 'example2', 'another']);
});

// Index support — these fail against the shared `get`, which spreads instead of indexing.
test('Indexes into an array with bracket notation', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(getWithArrayIndex(input, 'test[0].path')).toBe('example');
	expect(getWithArrayIndex(input, 'test[1].path')).toBe('another');
});

test('Indexes into an array with dot notation', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(getWithArrayIndex(input, 'test.0.path')).toBe('example');
	expect(getWithArrayIndex(input, 'test.1.path')).toBe('another');
});

test('Returns the indexed array entry itself', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(getWithArrayIndex(input, 'test[0]')).toEqual({ path: 'example' });
});

test('Returns default value if array index is out of range', () => {
	const input = { test: [{ path: 'example' }] };
	expect(getWithArrayIndex(input, 'test[5].path', 'default value')).toBe('default value');
});

test('Indexes into a nested array', () => {
	const input = { test: [{ path: [{ test: 'a' }, { test: 'b' }] }] };
	expect(getWithArrayIndex(input, 'test[0].path[1].test')).toBe('b');
});
