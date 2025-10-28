import { describe, test, expect, vi } from 'vitest';
import { getSnapshotDiff } from './get-snapshot-diff.js';
import { sanitizeField } from './sanitize-schema.js';
import type { Snapshot } from '@directus/types';

// Mock the sanitize functions
vi.mock('./sanitize-schema', () => ({
  sanitizeCollection: vi.fn((collection) => collection),
  sanitizeField: vi.fn((field) => field),
  sanitizeRelation: vi.fn((relation) => relation),
  sanitizeSystemField: vi.fn((field) => field),
}));

describe('getSnapshotDiff', () => {
  const createMockSnapshot = (overrides?: Record<string, unknown>) => ({
    version: 1,
    directus: '10.0.0',
    collections: [],
    fields: [],
    relations: [],
    systemFields: [],
    ...overrides,
  } as Snapshot);

  describe('collections', () => {
    test('should detect no changes when collections are identical', () => {
      const snapshot: Snapshot = createMockSnapshot({
        collections: [
          { collection: 'users', meta: null, schema: { name: 'users' } },
        ],
      });

      const result = getSnapshotDiff(snapshot, snapshot);

      expect(result.collections).toHaveLength(0);
    });

    test('should detect collection addition', () => {
      const current = createMockSnapshot({
        collections: [],
      });
      
      const after = createMockSnapshot({
        collections: [
          { collection: 'posts', meta: null, schema: { name: 'posts' } },
        ],
      });

      const result = getSnapshotDiff(current, after);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0]!.collection).toBe('posts');
      expect(result.collections[0]!.diff).toBeDefined();
    });

    test('should detect collection deletion', () => {
      const current = createMockSnapshot({
        collections: [
          { collection: 'posts', meta: null, schema: { name: 'posts' } },
        ],
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
        collections: [
          { collection: 'posts', meta: { hidden: false }, schema: { name: 'posts' } },
        ],
      });
      
      const after = createMockSnapshot({
        collections: [
          { collection: 'posts', meta: { hidden: true }, schema: { name: 'posts' } },
        ],
      });

      const result = getSnapshotDiff(current, after);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0]!.collection).toBe('posts');
    });

    test('should filter out fields and relations when collection is deleted', () => {
      const current = createMockSnapshot({
        collections: [
          { collection: 'posts', meta: null, schema: { name: 'posts' } },
        ],
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
        fields: [
          { collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
        ],
      });

      const result = getSnapshotDiff(current, after);

      expect(result.fields).toHaveLength(1);
      expect(result.fields[0]!.collection).toBe('posts');
      expect(result.fields[0]!.field).toBe('title');
    });

    test('should detect field deletion', () => {
      const current = createMockSnapshot({
        fields: [
          { collection: 'posts', field: 'title', type: 'string', meta: null, schema: null },
        ],
      });
      
      const after = createMockSnapshot({
        fields: [],
      });

      const result = getSnapshotDiff(current, after);

      expect(result.fields).toHaveLength(1);
      expect(result.fields[0]!.collection).toBe('posts');
      expect(result.fields[0]!.field).toBe('title');
    });

    test('should handle type change from regular field to alias', () => {
      const current = createMockSnapshot({
        fields: [
          { collection: 'posts', field: 'computed', type: 'string', meta: null, schema: null },
        ],
      });
      
      const after = createMockSnapshot({
        fields: [
          { collection: 'posts', field: 'computed', type: 'alias', meta: null, schema: null },
        ],
      });

      const result = getSnapshotDiff(current, after);

      expect(result.fields).toHaveLength(2); // One deletion, one addition
      expect(result.fields.some(f => f.field === 'computed')).toBe(true);
    });

    test('should handle type change from alias to regular field', () => {
      const current = createMockSnapshot({
        fields: [
          { collection: 'posts', field: 'computed', type: 'alias', meta: null, schema: null },
        ],
      });
      
      const after = createMockSnapshot({
        fields: [
          { collection: 'posts', field: 'computed', type: 'string', meta: null, schema: null },
        ],
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
              has_auto_increment: true 
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
              has_auto_increment: true 
            },
          },
        ],
      });

      getSnapshotDiff(current, after);

      expect(sanitizeField).toHaveBeenCalledWith(
        expect.objectContaining({ field: 'id' }),
        true // isAutoIncrementPrimaryKey should be true
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
        collections: [
          { collection: 'users', meta: null, schema: { name: 'users' } },
        ],
        fields: [
          { collection: 'users', field: 'id', type: 'integer', meta: null, schema: null },
        ],
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

      const nonEmptyCollections = result.collections.filter(c => c.diff);
      expect(nonEmptyCollections.length).toBeGreaterThan(0);
    });
  });
});