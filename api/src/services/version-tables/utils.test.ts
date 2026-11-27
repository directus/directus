import { describe, expect, test } from 'vitest';
import { flattenVersionSystemFields, isVersionSystemField, nestVersionSystemFields } from './utils.js';

describe('isReservedVersionField', () => {
	test('reserves the version system fields and the version reference prefix', () => {
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

describe('nestVersionSystemFields', () => {
	test('moves system columns into directus_version', () => {
		expect(nestVersionSystemFields({ id: 1, version_id: 2, version_type: 'draft', version_ref_author: 3 })).toEqual({
			id: 1,
			version_ref_author: 3,
			directus_version: { id: 2, type: 'draft' },
		});
	});

	test('leaves nested values like JSON untouched', () => {
		const json = { version_id: 5, nested: [{ version_type: 'x' }] };

		expect(nestVersionSystemFields({ id: 1, version_id: 2, data: json })).toEqual({
			id: 1,
			data: json,
			directus_version: { id: 2 },
		});
	});

	test('leaves rows without system columns untouched', () => {
		const row = { id: 1, author: { directus_version: { id: 3 } } };
		expect(nestVersionSystemFields(row)).toEqual(row);
	});

	test('merges into an existing directus_version object', () => {
		expect(nestVersionSystemFields({ directus_version: { id: 1 }, version_type: 'draft' })).toEqual({
			directus_version: { id: 1, type: 'draft' },
		});
	});
});

describe('flattenVersionSystemFields', () => {
	test('moves directus_version into system columns', () => {
		expect(flattenVersionSystemFields({ id: 1, directus_version: { id: 2, type: 'draft' } })).toEqual({
			id: 1,
			version_id: 2,
			version_type: 'draft',
		});
	});

	test('leaves nested values like JSON untouched', () => {
		const json = { directus_version: { foo: 1 } };

		expect(flattenVersionSystemFields({ data: json, directus_version: { id: 2 } })).toEqual({
			data: json,
			version_id: 2,
		});
	});

	test('rejects unknown keys', () => {
		expect(() => flattenVersionSystemFields({ directus_version: { foo: 1 } })).toThrow();
	});

	test('is the inverse of nestVersionSystemFields', () => {
		const row = { id: 1, version_id: 2, version_name: 'Draft', data: { version_id: 3 } };
		expect(flattenVersionSystemFields(nestVersionSystemFields(row))).toEqual(row);
	});
});
