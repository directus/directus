import { isSystemCollection, systemCollectionNames, systemCollectionRows } from './index.js';
import { describe, expect, test } from 'vitest';

describe('systemCollectionRows', () => {
	test('should be an array', () => {
		expect(Array.isArray(systemCollectionRows)).toBe(true);
	});

	test('should not be empty', () => {
		expect(systemCollectionRows.length).toBeGreaterThan(0);
	});

	test('should have system property set to true for all rows', () => {
		systemCollectionRows.forEach((row) => {
			expect(row.system).toBe(true);
		});
	});

	test('should have collection property for all rows', () => {
		systemCollectionRows.forEach((row) => {
			expect(row.collection).toBeDefined();
			expect(typeof row.collection).toBe('string');
		});
	});

	test('should allow data rows to override defaults', () => {
		// Find directus_settings which should have singleton: true (override from defaults)
		const settingsCollection = systemCollectionRows.find((row) => row.collection === 'directus_settings');

		if (settingsCollection) {
			expect(settingsCollection.singleton).toBe(true);
		}
	});

	test('should have all collections start with directus_', () => {
		systemCollectionRows.forEach((row) => {
			expect(row.collection?.startsWith('directus_')).toBe(true);
		});
	});

	test('should have unique collection names', () => {
		const collectionNames = systemCollectionRows.map((row) => row.collection);
		const uniqueNames = new Set(collectionNames);
		expect(collectionNames.length).toBe(uniqueNames.size);
	});
});

describe('systemCollectionNames', () => {
	test('should be an array of strings', () => {
		expect(Array.isArray(systemCollectionNames)).toBe(true);

		systemCollectionNames.forEach((name) => {
			expect(typeof name).toBe('string');
		});
	});

	test('should not be empty', () => {
		expect(systemCollectionNames.length).toBeGreaterThan(0);
	});

	test('should match the number of rows in systemCollectionRows', () => {
		expect(systemCollectionNames.length).toBe(systemCollectionRows.length);
	});
});

describe('isSystemCollection', () => {
	test('should return true for valid system collections', () => {
		expect(isSystemCollection('directus_users')).toBe(true);
		expect(isSystemCollection('directus_files')).toBe(true);
		expect(isSystemCollection('directus_collections')).toBe(true);
		expect(isSystemCollection('directus_fields')).toBe(true);
		expect(isSystemCollection('directus_activity')).toBe(true);
	});

	test('should return false for non-directus collections', () => {
		expect(isSystemCollection('users')).toBe(false);
		expect(isSystemCollection('articles')).toBe(false);
		expect(isSystemCollection('custom_table')).toBe(false);
		expect(isSystemCollection('my_collection')).toBe(false);
	});

	test('should return false for collections that start with directus_ but are not system collections', () => {
		expect(isSystemCollection('directus_custom')).toBe(false);
		expect(isSystemCollection('directus_my_table')).toBe(false);
		expect(isSystemCollection('directus_nonexistent_xyz_collection')).toBe(false);
	});

	test('should return false for empty strings', () => {
		expect(isSystemCollection('')).toBe(false);
	});

	test('should be case-sensitive', () => {
		expect(isSystemCollection('DIRECTUS_USERS')).toBe(false);
		expect(isSystemCollection('Directus_Users')).toBe(false);
		expect(isSystemCollection('DirectUs_users')).toBe(false);
	});

	test('should return false for collection names that almost start with directus_', () => {
		expect(isSystemCollection('directus')).toBe(false);
		expect(isSystemCollection('directu_users')).toBe(false);
		expect(isSystemCollection('xdirectus_users')).toBe(false);
		expect(isSystemCollection(' directus_users')).toBe(false);
		expect(isSystemCollection('directus_users ')).toBe(false);
	});

	test('should early return false when collection does not start with directus_', () => {
		// Test that the function correctly implements the early return optimization
		// by checking that non-directus_ collections always return false
		expect(isSystemCollection('my_collection')).toBe(false);
		expect(isSystemCollection('test')).toBe(false);
		expect(isSystemCollection('a')).toBe(false);
	});

	test('should return false for strings with directus_ in the middle', () => {
		expect(isSystemCollection('my_directus_collection')).toBe(false);
		expect(isSystemCollection('prefix_directus_users')).toBe(false);
	});

	test('should handle special characters', () => {
		expect(isSystemCollection('directus_')).toBe(false);
		expect(isSystemCollection('directus_\n')).toBe(false);
		expect(isSystemCollection('directus_\t')).toBe(false);
	});
});
