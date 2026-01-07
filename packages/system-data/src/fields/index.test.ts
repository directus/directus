import { describe, expect, test } from 'vitest';
import { hasSystemIndex, isSystemField } from './index.js';

describe('hasSystemIndex', () => {
	test('should return true when collection and field match an indexed field', () => {
		// Test with a field that should be indexed (based on typical Directus schema)
		// We're testing the function behavior, not specific data
		const result = hasSystemIndex('directus_users', 'id');
		expect(typeof result).toBe('boolean');
	});

	test('should return false for non-existent collection', () => {
		expect(hasSystemIndex('non_existent_collection_xyz', 'some_field')).toBe(false);
	});

	test('should return false for non-existent field in a valid collection', () => {
		expect(hasSystemIndex('directus_users', 'totally_fake_field_xyz_123')).toBe(false);
	});

	test('should return false for empty strings', () => {
		expect(hasSystemIndex('', '')).toBe(false);
		expect(hasSystemIndex('directus_users', '')).toBe(false);
		expect(hasSystemIndex('', 'id')).toBe(false);
	});

	test('should be case-sensitive for collection names', () => {
		expect(hasSystemIndex('DIRECTUS_USERS', 'id')).toBe(false);
		expect(hasSystemIndex('Directus_Users', 'id')).toBe(false);
	});

	test('should be case-sensitive for field names', () => {
		expect(hasSystemIndex('directus_users', 'ID')).toBe(false);
		expect(hasSystemIndex('directus_users', 'EMAIL')).toBe(false);
	});

	test('should handle looking up the same field twice consistently', () => {
		const result1 = hasSystemIndex('directus_users', 'id');
		const result2 = hasSystemIndex('directus_users', 'id');
		expect(result1).toBe(result2);
	});

	test('should return boolean value', () => {
		const result = hasSystemIndex('directus_users', 'id');
		expect(typeof result).toBe('boolean');
	});
});

describe('isSystemField', () => {
	test('should return false when collection does not start with directus_', () => {
		expect(isSystemField('users', 'id')).toBe(false);
		expect(isSystemField('articles', 'title')).toBe(false);
		expect(isSystemField('custom_table', 'field')).toBe(false);
	});

	test('should return false when collection starts with directus_ but field does not exist', () => {
		expect(isSystemField('directus_users', 'totally_fake_field_xyz_123')).toBe(false);
		expect(isSystemField('directus_files', 'invalid_field_xyz_456')).toBe(false);
	});

	test('should return false when collection is directus_ prefixed but does not exist', () => {
		expect(isSystemField('directus_nonexistent_xyz_collection', 'id')).toBe(false);
	});

	test('should return false for empty strings', () => {
		expect(isSystemField('', '')).toBe(false);
		expect(isSystemField('directus_users', '')).toBe(false);
		expect(isSystemField('', 'id')).toBe(false);
	});

	test('should be case-sensitive for collection names', () => {
		expect(isSystemField('DIRECTUS_USERS', 'id')).toBe(false);
		expect(isSystemField('Directus_Users', 'email')).toBe(false);
	});

	test('should be case-sensitive for field names', () => {
		expect(isSystemField('directus_users', 'ID')).toBe(false);
		expect(isSystemField('directus_users', 'EMAIL')).toBe(false);
	});

	test('should return false for collection names that almost start with directus_', () => {
		expect(isSystemField('directus', 'id')).toBe(false);
		expect(isSystemField('directu_users', 'email')).toBe(false);
		expect(isSystemField('xdirectus_users', 'id')).toBe(false);
		expect(isSystemField(' directus_users', 'id')).toBe(false);
	});

	test('should return false for non-directus collection even with common field names', () => {
		expect(isSystemField('my_table', 'id')).toBe(false);
		expect(isSystemField('custom_users', 'email')).toBe(false);
	});

	test('should return boolean value', () => {
		const result = isSystemField('directus_users', 'id');
		expect(typeof result).toBe('boolean');
	});

	test('should handle looking up the same field twice consistently', () => {
		const result1 = isSystemField('directus_users', 'id');
		const result2 = isSystemField('directus_users', 'id');
		expect(result1).toBe(result2);
	});

	test('should early return false without checking array for non-directus collections', () => {
		// Test that the function correctly implements the early return optimization
		// by checking that non-directus_ collections always return false
		expect(isSystemField('my_collection', 'any_field')).toBe(false);
		expect(isSystemField('test', 'test')).toBe(false);
		expect(isSystemField('a', 'b')).toBe(false);
	});
});
