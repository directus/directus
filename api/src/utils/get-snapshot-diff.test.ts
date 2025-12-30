import { getSnapshotDiff } from './get-snapshot-diff.js';
import { sanitizeField } from './sanitize-schema.js';
import type { Snapshot } from '@directus/types';
import { describe, expect, test, vi } from 'vitest';

// Mock the sanitize functions
vi.mock('./sanitize-schema', () => ({
	sanitizeCollection: vi.fn((collection) => collection),
	sanitizeField: vi.fn((field) => field),
	sanitizeRelation: vi.fn((relation) => relation),
	sanitizeSystemField: vi.fn((field) => field),
}));

describe('getSnapshotDiff', () => {
	const createMockSnapshot = (overrides?: Record<string, unknown>) =>
		({
			version: 1,
			directus: '10.0.0',
			collections: [],
			fields: [],
			relations: [],
			systemFields: [],
			...overrides,
		}) as Snapshot;

	describe('collections', () => {
		test('should detect no changes when collections are identical', () => {
			const snapshot: Snapshot = createMockSnapshot({
				collections: [{ collection: 'users', meta: null, schema: { name: 'users' } }],
			});

			const result = getSnapshotDiff(snapshot, snapshot);

			expect(result.collections).toHaveLength(0);
		});

		test('should detect collection addition', () => {
			const current = createMockSnapshot({
				collections: [],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'posts', meta: null, schema: { name: 'posts' } }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0]!.collection).toBe('posts');
			expect(result.collections[0]!.diff).toBeDefined();
		});

		test('should detect collection deletion', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: null, schema: { name: 'posts' } }],
			});

			const after = createMockSnapshot({
				collections: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0]!.collection).toBe('posts');
			expect(result.collections[0]!.diff).toBeDefined();
		});

		test('should detect collection modification', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: false }, schema: { name: 'posts' } }],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(1);
			expect(result.collections[0]!.collection).toBe('posts');
		});

		test('should filter out fields and relations when collection is deleted', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: null, schema: { name: 'posts' } }],
				fields: [
					{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null },
					{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
				],
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: null,
						schema: null,
					},
				],
			});

			const after = createMockSnapshot({
				collections: [],
				fields: [],
				relations: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(1);
			expect(result.fields).toHaveLength(0); // Should be filtered out
			expect(result.relations).toHaveLength(0); // Should be filtered out
		});
	});

	describe('fields', () => {
		test('should detect field addition', () => {
			const current = createMockSnapshot({
				fields: [],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.collection).toBe('posts');
			expect(result.fields[0]!.field).toBe('title');
		});

		test('should detect field deletion', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.collection).toBe('posts');
			expect(result.fields[0]!.field).toBe('title');
		});

		test('should detect field modification (meta changes)', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'title', type: 'string', meta: { hidden: false }, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'title', type: 'string', meta: { hidden: true }, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.collection).toBe('posts');
			expect(result.fields[0]!.field).toBe('title');
			expect(result.fields[0]!.diff).toBeDefined();
		});

		test('should detect field type change (non-alias)', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'count', type: 'integer', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'count', type: 'bigInteger', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1);
			expect(result.fields[0]!.collection).toBe('posts');
			expect(result.fields[0]!.field).toBe('count');
			expect(result.fields[0]!.diff).toBeDefined();
		});

		test('should handle type change from regular field to alias', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'computed', type: 'string', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'computed', type: 'alias', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(2); // One deletion, one addition
			expect(result.fields.some((f) => f.field === 'computed')).toBe(true);
		});

		test('should handle type change from alias to regular field', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'computed', type: 'alias', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'computed', type: 'string', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(2); // One deletion, one addition
		});

		test('should pass isAutoIncrementPrimaryKey flag to sanitizeField', () => {
			const current = createMockSnapshot({
				fields: [
					{
						collection: 'posts',
						field: 'id',
						type: 'integer',
						meta: null,
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			});

			const after = createMockSnapshot({
				fields: [
					{
						collection: 'posts',
						field: 'id',
						type: 'integer',
						meta: null,
						schema: {
							is_primary_key: true,
							has_auto_increment: true,
						},
					},
				],
			});

			getSnapshotDiff(current, after);

			expect(sanitizeField).toHaveBeenCalledWith(
				expect.objectContaining({ field: 'id' }),
				true, // isAutoIncrementPrimaryKey should be true
			);
		});
	});

	describe('systemFields', () => {
		test('should detect system field addition with indexing', () => {
			const current = createMockSnapshot({
				systemFields: [],
			});

			const after = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toHaveLength(1);
			expect(result.systemFields[0]!.collection).toBe('posts');
			expect(result.systemFields[0]!.field).toBe('date_created');
		});

		test('should handle system field deletion by inverting indexed state', () => {
			const current = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const after = createMockSnapshot({
				systemFields: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toBeDefined();
		});

		test('should filter out non-indexed system fields from after snapshot', () => {
			const current = createMockSnapshot({
				systemFields: [],
			});

			const after = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: false },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toHaveLength(0);
		});

		test('should handle undefined systemFields arrays', () => {
			const current = createMockSnapshot({
				systemFields: undefined,
			});

			const after = createMockSnapshot({
				systemFields: undefined,
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toHaveLength(0);
		});
	});

	describe('relations', () => {
		test('should detect relation addition', () => {
			const current = createMockSnapshot({
				relations: [],
			});

			const after = createMockSnapshot({
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: null,
						schema: null,
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.relations).toHaveLength(1);
			expect(result.relations[0]!.collection).toBe('posts');
			expect(result.relations[0]!.field).toBe('author_id');
			expect(result.relations[0]!.related_collection).toBe('users');
		});

		test('should detect relation deletion', () => {
			const current = createMockSnapshot({
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: null,
						schema: null,
					},
				],
			});

			const after = createMockSnapshot({
				relations: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.relations).toHaveLength(1);
			expect(result.relations[0]!.collection).toBe('posts');
			expect(result.relations[0]!.field).toBe('author_id');
		});

		test('should detect relation modification', () => {
			const current = createMockSnapshot({
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: { junction_field: null },
						schema: null,
					},
				],
			});

			const after = createMockSnapshot({
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: { junction_field: 'user_id' },
						schema: null,
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.relations).toBeDefined();
		});
	});

	describe('filtering empty diffs', () => {
		test('should filter out items with no differences', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'users', meta: null, schema: { name: 'users' } }],
				fields: [{ collection: 'users', field: 'id', type: 'integer', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, current);

			expect(result.collections).toHaveLength(0);
			expect(result.fields).toHaveLength(0);
			expect(result.relations).toHaveLength(0);
			expect(result.systemFields).toHaveLength(0);
		});

		test('should only include items with actual differences', () => {
			const current = createMockSnapshot({
				collections: [
					{ collection: 'users', meta: null, schema: { name: 'users' } },
					{ collection: 'posts', meta: null, schema: { name: 'posts' } },
				],
			});

			const after = createMockSnapshot({
				collections: [
					{ collection: 'users', meta: null, schema: { name: 'users' } },
					{ collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } },
				],
			});

			const result = getSnapshotDiff(current, after);

			const nonEmptyCollections = result.collections.filter((c) => c.diff);
			expect(nonEmptyCollections.length).toBeGreaterThan(0);
		});
	});

	describe('multiple simultaneous changes', () => {
		test('should handle multiple collections being added and modified at once', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'users', meta: null, schema: { name: 'users' } }],
			});

			const after = createMockSnapshot({
				collections: [
					{ collection: 'users', meta: { hidden: true }, schema: { name: 'users' } },
					{ collection: 'posts', meta: null, schema: { name: 'posts' } },
					{ collection: 'comments', meta: null, schema: { name: 'comments' } },
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections.length).toBeGreaterThan(0);
			expect(result.collections.some((c) => c.collection === 'users')).toBe(true);
			expect(result.collections.some((c) => c.collection === 'posts')).toBe(true);
			expect(result.collections.some((c) => c.collection === 'comments')).toBe(true);
		});

		test('should handle changes across all snapshot types simultaneously', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: null, schema: { name: 'posts' } }],
				fields: [{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null }],
				relations: [],
				systemFields: [],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } }],
				fields: [
					{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null },
					{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
				],
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: null,
						schema: null,
					},
				],
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections.length).toBeGreaterThan(0);
			expect(result.fields.length).toBeGreaterThan(0);
			expect(result.relations.length).toBeGreaterThan(0);
			expect(result.systemFields.length).toBeGreaterThan(0);
		});

		test('should handle multiple fields being added, modified, and deleted', () => {
			const current = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null },
					{ collection: 'posts', field: 'title', type: 'string', meta: { hidden: false }, schema: null },
					{ collection: 'posts', field: 'old_field', type: 'string', meta: null, schema: null },
				],
			});

			const after = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null },
					{ collection: 'posts', field: 'title', type: 'string', meta: { hidden: true }, schema: null },
					{ collection: 'posts', field: 'new_field', type: 'string', meta: null, schema: null },
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields.length).toBeGreaterThan(0);
			expect(result.fields.some((f) => f.field === 'title')).toBe(true); // Modified
			expect(result.fields.some((f) => f.field === 'old_field')).toBe(true); // Deleted
			expect(result.fields.some((f) => f.field === 'new_field')).toBe(true); // Added
		});
	});

	describe('edge cases', () => {
		test('should handle empty snapshots', () => {
			const empty = createMockSnapshot({
				collections: [],
				fields: [],
				relations: [],
				systemFields: [],
			});

			const result = getSnapshotDiff(empty, empty);

			expect(result.collections).toHaveLength(0);
			expect(result.fields).toHaveLength(0);
			expect(result.relations).toHaveLength(0);
			expect(result.systemFields).toHaveLength(0);
		});

		test('should handle null meta and schema values', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: null, schema: null }],
				fields: [{ collection: 'posts', field: 'id', type: 'integer', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } }],
				fields: [{ collection: 'posts', field: 'id', type: 'integer', meta: { required: true }, schema: {} }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections.length).toBeGreaterThan(0);
			expect(result.fields.length).toBeGreaterThan(0);
		});

		test('should handle fields with missing schema properties', () => {
			const current = createMockSnapshot({
				fields: [
					{
						collection: 'posts',
						field: 'id',
						type: 'integer',
						meta: null,
						schema: {},
					},
				],
			});

			const after = createMockSnapshot({
				fields: [
					{
						collection: 'posts',
						field: 'id',
						type: 'integer',
						meta: null,
						schema: {
							is_primary_key: false,
							has_auto_increment: false,
						},
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toBeDefined();
		});

		test('should handle collections with same name but different cases', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'Posts', meta: null, schema: { name: 'Posts' } }],
			});

			const after = createMockSnapshot({
				collections: [
					{ collection: 'Posts', meta: null, schema: { name: 'Posts' } },
					{ collection: 'posts', meta: null, schema: { name: 'posts' } },
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections.some((c) => c.collection === 'posts')).toBe(true);
		});
	});

	describe('alias field edge cases', () => {
		test('should handle multiple alias type changes in one diff', () => {
			const current = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'field1', type: 'alias', meta: null, schema: null },
					{ collection: 'posts', field: 'field2', type: 'string', meta: null, schema: null },
				],
			});

			const after = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'field1', type: 'string', meta: null, schema: null },
					{ collection: 'posts', field: 'field2', type: 'alias', meta: null, schema: null },
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(4); // 2 deletions + 2 additions
		});

		test('should not treat non-alias type changes as delete+add', () => {
			const current = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'count', type: 'integer', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				fields: [{ collection: 'posts', field: 'count', type: 'float', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1); // Just a modification, not delete+add
		});

		test('should handle field changing to alias with same name in different collection', () => {
			const current = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'name', type: 'string', meta: null, schema: null },
					{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null },
				],
			});

			const after = createMockSnapshot({
				fields: [
					{ collection: 'posts', field: 'name', type: 'alias', meta: null, schema: null },
					{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null },
				],
			});

			const result = getSnapshotDiff(current, after);

			const postFields = result.fields.filter((f) => f.collection === 'posts');
			expect(postFields).toHaveLength(2); // delete + add for posts.name
			const userFields = result.fields.filter((f) => f.collection === 'users');
			expect(userFields).toHaveLength(0); // no change for users.name
		});
	});

	describe('systemFields indexing', () => {
		test('should detect index change from false to true', () => {
			const current = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: false },
					},
				],
			});

			const after = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toHaveLength(1);
		});

		test('should detect index change from true to false', () => {
			const current = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const after = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: false },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields).toHaveLength(1);
		});

		test('should handle multiple systemFields with mixed indexing states', () => {
			const current = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
					{
						collection: 'posts',
						field: 'date_updated',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: false },
					},
				],
			});

			const after = createMockSnapshot({
				systemFields: [
					{
						collection: 'posts',
						field: 'date_created',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
					{
						collection: 'posts',
						field: 'date_updated',
						type: 'timestamp',
						meta: null,
						schema: { is_indexed: true },
					},
				],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.systemFields.some((f) => f.field === 'date_updated')).toBe(true);
		});
	});

	describe('complex deletion scenarios', () => {
		test('should not filter fields when parent collection is only modified', () => {
			const current = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: false }, schema: { name: 'posts' } }],
				fields: [{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null }],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } }],
				fields: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.fields).toHaveLength(1); // Field deletion should be tracked
		});

		test('should handle deletion of multiple collections with their fields and relations', () => {
			const current = createMockSnapshot({
				collections: [
					{ collection: 'posts', meta: null, schema: { name: 'posts' } },
					{ collection: 'comments', meta: null, schema: { name: 'comments' } },
					{ collection: 'users', meta: null, schema: { name: 'users' } },
				],
				fields: [
					{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
					{ collection: 'comments', field: 'text', type: 'string', meta: null, schema: null },
					{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null },
				],
				relations: [
					{
						collection: 'posts',
						field: 'author_id',
						related_collection: 'users',
						meta: null,
						schema: null,
					},
					{
						collection: 'comments',
						field: 'post_id',
						related_collection: 'posts',
						meta: null,
						schema: null,
					},
				],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'users', meta: null, schema: { name: 'users' } }],
				fields: [{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null }],
				relations: [],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(2); // posts and comments deleted
			expect(result.fields).toHaveLength(0); // Filtered out due to collection deletion
			expect(result.relations).toHaveLength(0); // Filtered out due to collection deletion
		});

		test('should preserve field deletions from collections that still exist', () => {
			const current = createMockSnapshot({
				collections: [
					{ collection: 'posts', meta: null, schema: { name: 'posts' } },
					{ collection: 'users', meta: null, schema: { name: 'users' } },
				],
				fields: [
					{ collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
					{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null },
				],
			});

			const after = createMockSnapshot({
				collections: [{ collection: 'users', meta: null, schema: { name: 'users' } }],
				fields: [{ collection: 'users', field: 'name', type: 'string', meta: null, schema: null }],
			});

			const result = getSnapshotDiff(current, after);

			expect(result.collections).toHaveLength(1); // posts deleted
			expect(result.fields).toHaveLength(0); // posts.title filtered out because collection deleted
		});
	});
});
