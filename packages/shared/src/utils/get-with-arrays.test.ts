import { test, expect } from 'vitest';

import { get } from './get-with-arrays';

test('Returns static value from object', () => {
	const input = { test: { path: 'example' } };
	expect(get(input, 'test.path')).toBe('example');
});

test('Returns default value if path does not exist in object', () => {
	const input = { test: { path: 'example' } };
	expect(get(input, 'test.wrong', 'default value')).toBe('default value');
});

test('Returns values in array path as flattened array', () => {
	const input = { test: [{ path: 'example' }, { path: 'another' }] };
	expect(get(input, 'test.path')).toEqual(['example', 'another']);
});
