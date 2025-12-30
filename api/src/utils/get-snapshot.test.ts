import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';
import { getSnapshot } from './get-snapshot.js';

// Mock dependencies
vi.mock('directus/version', () => ({
	version: '10.0.0',
}));

vi.mock('../database/index.js', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn(),
}));

vi.mock('../services/collections.js', () => ({
	CollectionsService: vi.fn(),
}));

vi.mock('../services/fields.js', () => ({
	FieldsService: vi.fn(),
}));

vi.mock('../services/relations.js', () => ({
	RelationsService: vi.fn(),
}));

vi.mock('./get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('./sanitize-schema.js', () => ({
	sanitizeCollection: vi.fn((c) => c),
	sanitizeField: vi.fn((f) => f),
	sanitizeRelation: vi.fn((r) => r),
	sanitizeSystemField: vi.fn((f) => f),
}));

import getDatabase, { getDatabaseClient } from '../database/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from './get-schema.js';
import { sanitizeCollection, sanitizeField, sanitizeRelation, sanitizeSystemField } from './sanitize-schema.js';

describe('getSnapshot', () => {
	let mockDatabase: Partial<Knex>;
	let mockSchema: SchemaOverview;
	let mockCollectionsService: any;
	let mockFieldsService: any;
	let mockRelationsService: any;

	beforeEach(() => {
		vi.clearAllMocks();

		mockDatabase = {} as Knex;
		mockSchema = {} as SchemaOverview;

		mockCollectionsService = {
			readByQuery: vi.fn(),
		};

		mockFieldsService = {
			readAll: vi.fn(),
		};

		mockRelationsService = {
			readAll: vi.fn(),
		};

		(getDatabase as Mock).mockReturnValue(mockDatabase);
		(getDatabaseClient as Mock).mockReturnValue('postgres');
		(getSchema as Mock).mockResolvedValue(mockSchema);

		(CollectionsService as Mock).mockImplementation(() => mockCollectionsService);
		(FieldsService as Mock).mockImplementation(() => mockFieldsService);
		(RelationsService as Mock).mockImplementation(() => mockRelationsService);
	});

	describe('basic functionality', () => {
		test('should return a snapshot with correct structure', async () => {
			// Setup mock data
			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			expect(snapshot).toMatchObject({
				version: 1,
				directus: '10.0.0',
				vendor: 'postgres',
				collections: [],
				fields: [],
				systemFields: [],
				relations: [],
			});
		});

		test('should use provided database and schema options', async () => {
			const customDb = { custom: 'db' } as any;
			const customSchema = { custom: 'schema' } as any;

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await getSnapshot({ database: customDb, schema: customSchema });

			expect(getDatabase).not.toHaveBeenCalled();
			expect(getSchema).not.toHaveBeenCalled();

			expect(CollectionsService).toHaveBeenCalledWith({
				knex: customDb,
				schema: customSchema,
			});
		});

		test('should fetch schema with bypassCache when not provided', async () => {
			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await getSnapshot();

			expect(getSchema).toHaveBeenCalledWith({
				database: mockDatabase,
				bypassCache: true,
			});
		});
	});

	describe('filtering logic', () => {
		test('should exclude system collections', async () => {
			const collections = [
				{ collection: 'users', meta: { system: true } },
				{ collection: 'custom', meta: { system: false } },
				{ collection: 'another', meta: {} },
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			expect(snapshot.collections).toHaveLength(2);

			expect(snapshot.collections).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ collection: 'another' }),
					expect.objectContaining({ collection: 'custom' }),
				]),
			);
		});

		test('should exclude untracked items (with null meta) by default', async () => {
			const collections = [
				{
					collection: 'test',
					meta: null,
					schema: {},
				},
				{
					collection: 'lorem',
					meta: {},
					schema: {},
				},
			];

			const fields = [
				{ field: 'id', collection: 'test', meta: null },
				{ field: 'name', collection: 'test', meta: {} },
				{ field: 'description', collection: 'test', meta: { interface: 'input' } },
			];

			const relations = [
				{
					collection: 'dolor',
					meta: null,
					schema: {},
				},
				{
					collection: 'sat',
					meta: {},
					schema: {},
				},
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue(fields);
			mockRelationsService.readAll.mockResolvedValue(relations);

			const snapshot = await getSnapshot();

			expect(snapshot.collections).toHaveLength(1);
			expect(snapshot.collections[0]!.collection).toEqual('lorem');
			expect(snapshot.fields).toHaveLength(2);
			expect(snapshot.fields.map((f: any) => f.field)).toEqual(['name', 'description']);
			expect(snapshot.relations).toHaveLength(1);
			expect(snapshot.relations[0]!.collection).toEqual('sat');
		});

		test('should include untracked items (with null meta) when includeUntracked true', async () => {
			const collections = [
				{
					collection: 'test',
					meta: null,
					schema: {},
				},
				{
					collection: 'lorem',
					meta: {},
					schema: {},
				},
			];

			const fields = [
				{ field: 'id', collection: 'test', meta: null },
				{ field: 'name', collection: 'test', meta: {} },
				{ field: 'description', collection: 'test', meta: { interface: 'input' } },
			];

			const relations = [
				{
					collection: 'dolor',
					meta: null,
					schema: {},
				},
				{
					collection: 'sat',
					meta: {},
					schema: {},
				},
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue(fields);
			mockRelationsService.readAll.mockResolvedValue(relations);

			const snapshot = await getSnapshot({ includeUntracked: true });

			expect(snapshot.collections).toHaveLength(2);
			expect(snapshot.collections.map((c) => c.collection)).toEqual(['lorem', 'test']);
			expect(snapshot.fields).toHaveLength(3);
			expect(snapshot.fields.map((f) => f.field)).toEqual(['id', 'name', 'description']);
			expect(snapshot.relations).toHaveLength(2);
			expect(snapshot.relations.map((r) => r.collection)).toEqual(['dolor', 'sat']);
		});

		test('should include indexed system fields in systemFields', async () => {
			const fields = [
				{
					field: 'id',
					collection: 'test',
					meta: { system: true },
					schema: { is_indexed: true },
				},
				{
					field: 'created_by',
					collection: 'test',
					meta: { system: true },
					schema: { is_indexed: false },
				},
				{
					field: 'custom',
					collection: 'test',
					meta: { system: false },
					schema: { is_indexed: true },
				},
			];

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue(fields);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			expect(snapshot.systemFields).toHaveLength(1);

			expect(snapshot.systemFields[0]).toMatchObject({
				field: 'id',
				collection: 'test',
			});

			expect(snapshot.fields).toHaveLength(1);

			expect(snapshot.fields[0]).toMatchObject({
				field: 'custom',
				collection: 'test',
			});
		});
	});

	describe('sorting', () => {
		test('should sort collections by collection name', async () => {
			const collections = [
				{ collection: 'zebra', meta: {} },
				{ collection: 'alpha', meta: {} },
				{ collection: 'beta', meta: {} },
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			expect(snapshot.collections.map((c: any) => c.collection)).toEqual(['alpha', 'beta', 'zebra']);
		});

		test('should sort fields by collection and meta.id', async () => {
			const fields = [
				{ field: 'field1', collection: 'beta', meta: { id: 3 } },
				{ field: 'field2', collection: 'alpha', meta: { id: 2 } },
				{ field: 'field3', collection: 'beta', meta: { id: 1 } },
				{ field: 'field4', collection: 'alpha', meta: { id: 4 } },
			];

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue(fields);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			expect(snapshot.fields.map((f: any) => f.field)).toEqual(['field2', 'field4', 'field3', 'field1']);
		});

		test('should sort relations by collection and meta.id', async () => {
			const relations = [
				{ collection: 'beta', meta: { id: 2 } },
				{ collection: 'alpha', meta: { id: 3 } },
				{ collection: 'beta', meta: { id: 1 } },
				{ collection: 'alpha', meta: { id: 1 } },
			];

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue(relations);

			const snapshot = await getSnapshot();

			const sortedRelations = snapshot.relations.map((r: any) => ({
				collection: r.collection,
				id: r.meta?.id,
			}));

			expect(sortedRelations).toEqual([
				{ collection: 'alpha', id: undefined }, // id is omitted
				{ collection: 'alpha', id: undefined },
				{ collection: 'beta', id: undefined },
				{ collection: 'beta', id: undefined },
			]);
		});

		test('should deep sort object properties', async () => {
			const collections = [
				{
					collection: 'test',
					meta: {
						z_prop: 'z',
						a_prop: 'a',
					},
				},
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			const snapshot = await getSnapshot();

			// Check that properties are sorted alphabetically
			const metaKeys = Object.keys(snapshot.collections[0]!.meta!);
			expect(metaKeys[0]).toBe('a_prop');
			expect(metaKeys[metaKeys.length - 1]).toBe('z_prop');
		});
	});

	describe('sanitization', () => {
		test('should sanitize collections', async () => {
			const collection = { collection: 'test', meta: {} };
			mockCollectionsService.readByQuery.mockResolvedValue([collection]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await getSnapshot();

			expect(sanitizeCollection).toHaveBeenCalledWith(expect.objectContaining({ collection: 'test' }));
		});

		test('should sanitize fields and omit meta.id', async () => {
			const field = { field: 'test', collection: 'test', meta: { id: 1, interface: 'input' } };
			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([field]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await getSnapshot();

			expect(sanitizeField).toHaveBeenCalledWith(
				expect.objectContaining({
					field: 'test',
					collection: 'test',
					meta: { interface: 'input' },
				}),
			);
		});

		test('should sanitize relations and omit meta.id', async () => {
			const relation = {
				collection: 'test',
				field: 'test_field',
				meta: { id: 1, many_collection: 'other' },
			};

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([relation]);

			await getSnapshot();

			expect(sanitizeRelation).toHaveBeenCalledWith(
				expect.objectContaining({
					collection: 'test',
					field: 'test_field',
					meta: { many_collection: 'other' },
				}),
			);
		});

		test('should sanitize system fields', async () => {
			const systemField = {
				field: 'id',
				collection: 'test',
				meta: { system: true },
				schema: { is_indexed: true },
			};

			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockResolvedValue([systemField]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await getSnapshot();

			expect(sanitizeSystemField).toHaveBeenCalledWith(systemField);
		});
	});

	describe('error handling', () => {
		test('should propagate errors from services', async () => {
			const error = new Error('Service error');
			mockCollectionsService.readByQuery.mockRejectedValue(error);
			mockFieldsService.readAll.mockResolvedValue([]);
			mockRelationsService.readAll.mockResolvedValue([]);

			await expect(getSnapshot()).rejects.toThrow('Service error');
		});

		test('should handle Promise.all rejection', async () => {
			mockCollectionsService.readByQuery.mockResolvedValue([]);
			mockFieldsService.readAll.mockRejectedValue(new Error('Fields error'));
			mockRelationsService.readAll.mockResolvedValue([]);

			await expect(getSnapshot()).rejects.toThrow('Fields error');
		});
	});

	describe('integration scenarios', () => {
		test('should handle complex mixed data correctly', async () => {
			const collections = [
				{ collection: 'users', meta: { system: true } },
				{ collection: 'posts', meta: { singleton: false } },
				{ collection: 'comments', meta: null }, // untracked
				{ collection: 'tags', meta: {} },
			];

			const fields = [
				// System field with index
				{
					field: 'id',
					collection: 'posts',
					meta: { system: true },
					schema: { is_indexed: true },
				},
				// System field without index
				{
					field: 'created_at',
					collection: 'posts',
					meta: { system: true },
					schema: { is_indexed: false },
				},
				// Regular field
				{ field: 'title', collection: 'posts', meta: { interface: 'input' } },
				// Untracked field
				{ field: 'temp', collection: 'posts', meta: null },
			];

			const relations = [
				{
					collection: 'posts',
					field: 'author',
					meta: { id: 1, many_collection: 'users' },
				},
				{ collection: 'comments', meta: null }, // untracked
			];

			mockCollectionsService.readByQuery.mockResolvedValue(collections);
			mockFieldsService.readAll.mockResolvedValue(fields);
			mockRelationsService.readAll.mockResolvedValue(relations);

			const snapshot = await getSnapshot();

			// Should have 2 collections (posts and tags)
			expect(snapshot.collections).toHaveLength(2);
			expect(snapshot.collections.map((c: any) => c.collection)).toEqual(['posts', 'tags']);

			// Should have 1 regular field
			expect(snapshot.fields).toHaveLength(1);
			expect(snapshot.fields[0]).toMatchObject({ field: 'title' });

			// Should have 1 system field (indexed only)
			expect(snapshot.systemFields).toHaveLength(1);
			expect(snapshot.systemFields[0]).toMatchObject({ field: 'id' });

			// Should have 1 relation
			expect(snapshot.relations).toHaveLength(1);
			expect(snapshot.relations[0]).toMatchObject({ collection: 'posts' });
		});
	});
});
