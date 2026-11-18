import { describe, expect, test } from 'vitest';
import { isReservedVersionField } from './utils.js';

describe('isReservedVersionField', () => {
	test('reserves the version meta fields and the version reference prefix', () => {
		expect(isReservedVersionField('version_type')).toBe(true);
		expect(isReservedVersionField('version_id')).toBe(true);
		expect(isReservedVersionField('version_ref_author')).toBe(true);
	});

	test('allows other field names', () => {
		expect(isReservedVersionField('version')).toBe(false);
		expect(isReservedVersionField('version_number')).toBe(false);
		expect(isReservedVersionField('title')).toBe(false);
	});
});
