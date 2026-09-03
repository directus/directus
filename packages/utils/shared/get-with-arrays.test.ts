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

/** An object `depth` levels deep, with `leaf` at the bottom of a path of `a` keys */
function nest(depth: number, leaf: unknown) {
	let object: Record<string, any> = { a: leaf };

	for (let level = 1; level < depth; level++) {
		object = { a: object };
	}

	return object;
}

test('Follows a path at the depth limit', () => {
	const path = Array.from({ length: 25 }, () => 'a').join('.');

	expect(get(nest(25, 'example'), path)).toBe('example');
});

test('Returns default value for a path one segment past the depth limit', () => {
	const path = Array.from({ length: 26 }, () => 'a').join('.');

	expect(get(nest(26, 'example'), path, 'default value')).toBe('default value');
});

// A path with far more segments than any object is deep is the shape that costs quadratic string
// work when the remainder is re-split per level. The depth cap rejects it before the walk starts,
// so this covers the cap only — the loop is never entered at this length. Asserting completion
// rather than elapsed time keeps this stable in CI.
test('Returns default value for a pathological path without stalling or overflowing', () => {
	const depth = 20_000;
	const path = Array.from({ length: depth }, () => 'a').join('.');

	expect(get(nest(depth, 'example'), path, 'default value')).toBe('default value');
});
