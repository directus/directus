import { expect, test, vi } from 'vitest';
import { getDefaultType, getTypeMapEntry } from './get-type-map-entry.js';

vi.mock('../constants/type-map.js', () => ({
	TYPE_MAP_REGEX: [
		[/^TEST_KEY$/, 'string'],
		[/^TEST_DURATION$/, ['milliseconds', 'false']],
		[/^STORAGE_.+_SECRET$/, 'number'],
		// Duplicate pattern, to verify the first match is used
		[/^STORAGE_.+_SECRET$/, 'boolean'],
	],
}));

test.each([
	['TEST_KEY', 'string'],
	['TEST_DURATION', ['milliseconds', 'false']],
	['STORAGE_LOCAL_SECRET', 'number'],
	['STORAGE_S3_SECRET', 'number'],
	['STORAGE__SECRET', null],
	['NON_EXISTING', null],
	['', null],
	[undefined, null],
])('getTypeMapEntry returns the entry for %j', (key, expected) => {
	expect(getTypeMapEntry(key)).toEqual(expected);
});

test.each([
	['TEST_KEY', 'string'],
	['TEST_DURATION', 'milliseconds'],
	['STORAGE_LOCAL_SECRET', 'number'],
	['NON_EXISTING', null],
	[undefined, null],
])('getDefaultType returns the type for %j', (key, expected) => {
	expect(getDefaultType(key)).toBe(expected);
});
