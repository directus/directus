import { getDefaultType } from './get-default-type.js';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../constants/type-map.js', () => ({
	TYPE_MAP_REGEX: [
		[new RegExp('test-key'), 'string'],
		[new RegExp('STORAGE_.+_SECRET'), 'number'],
	],
}));

afterEach(() => {
	vi.clearAllMocks();
});

test('Returns type for wildcards', () => {
	expect(getDefaultType('STORAGE_HELLO_SECRET')).toBe('number');
	expect(getDefaultType('STORAGE_WOW_SECRET')).toBe('number');
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
