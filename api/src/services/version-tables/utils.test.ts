import { describe, expect, test } from 'vitest';
import { isVersionSystemField } from './utils.js';

describe('isReservedVersionField', () => {
	test('reserves the version meta fields and the version reference prefix', () => {
		expect(isVersionSystemField('version_type')).toBe(true);
		expect(isVersionSystemField('version_id')).toBe(true);
		expect(isVersionSystemField('version_ref_author')).toBe(true);
	});

	test('allows other field names', () => {
		expect(isVersionSystemField('version')).toBe(false);
		expect(isVersionSystemField('version_number')).toBe(false);
		expect(isVersionSystemField('title')).toBe(false);
	});
});
