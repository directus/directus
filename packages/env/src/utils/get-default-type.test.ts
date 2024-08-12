import { afterEach, expect, test, vi } from 'vitest';
import { getDefaultType } from './get-default-type.js';

vi.mock('../constants/type-map.js', () => ({
	TYPE_MAP: {
		'test-key': 'string',
	},
}));

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns type from map if exists', () => {
	const res = getDefaultType('test-key');
	expect(res).toBe('string');
});

test('Returns null if key does not exist', () => {
	const res = getDefaultType('non-existing');
	expect(res).toBe(null);
});

test('Returns null if key is undefined', () => {
	const res = getDefaultType(undefined);
	expect(res).toBe(null);
});
