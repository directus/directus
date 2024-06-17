import { afterEach, expect, test, vi } from 'vitest';
import { getTypeFromMap } from './get-type-from-map.js';

vi.mock('../constants/type-map.js', () => ({
	TYPE_MAP: {
		'test-key': 'string',
	},
}));

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns type from map if exists', () => {
	const res = getTypeFromMap('test-key');
	expect(res).toBe('string');
});

test('Returns null if key does not exist', () => {
	const res = getTypeFromMap('non-existing');
	expect(res).toBe(null);
});

test('Returns null if key is undefined', () => {
	const res = getTypeFromMap(undefined);
	expect(res).toBe(null);
});
