import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Collection, FieldMutationOptions } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as cacheModule from '../cache.js';
import { createMockKnex, resetKnexMocks, setupSystemCollectionMocks } from '../test-utils/knex.js';
import * as getSchemaModule from '../utils/get-schema.js';
import { CollectionsService } from './collections.js';
import { FieldsService } from './fields.js';
import { ItemsService } from './items.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../../src/database/index', async () => {
	const { mockDatabase } = await import('../test-utils/database.js');
	return mockDatabase();
});

vi.mock('@directus/schema', async () => {
	const { mockSchema } = await import('../test-utils/schema.js');
	return mockSchema();
});

vi.mock('../cache.js', async () => {
	const { mockCache } = await import('../test-utils/cache.js');
	return mockCache();
});

vi.mock('../emitter.js', async () => {
	const { mockEmitter } = await import('../test-utils/emitter.js');
	return mockEmitter();
});

vi.mock('./items.js', async () => {
	const { mockItemsService } = await import('../test-utils/services/items-service.js');
	return mockItemsService();
});

vi.mock('../utils/transaction.js', async () => {
	const { mockTransaction } = await import('../test-utils/database.js');
	return mockTransaction();
});

vi.mock('../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js', () => ({
	fetchAllowedCollections: vi.fn(),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../utils/should-clear-cache.js', () => ({
	shouldClearCache: vi.fn().mockReturnValue(true),
}));

vi.mock('./fields.js', () => {
	const FieldsService = vi.fn();
	FieldsService.prototype.addColumnToTable = vi.fn().mockImplementation(() => {});
	FieldsService.prototype.addColumnIndex = vi.fn().mockResolvedValue(undefined);
	FieldsService.prototype.deleteField = vi.fn().mockResolvedValue(undefined);
	return { FieldsService };
});

vi.mock('./fields/build-collection-and-field-relations.js', () => ({
	buildCollectionAndFieldRelations: vi.fn().mockResolvedValue({
		collectionRelationTree: new Map(),
		fieldToCollectionList: new Map(),
	}),
}));

vi.mock('./fields/get-collection-relation-list.js', () => ({
	getCollectionRelationList: vi.fn().mockReturnValue(new Set()),
}));

vi.mock('./fields/get-collection-meta-updates.js', () => ({
	getCollectionMetaUpdates: vi.fn().mockReturnValue([]),
}));

const schema = new SchemaBuilder()
	.collection('directus_collections', (c) => {
		c.field('collection').string().primary();
	})
	.collection('directus_fields', (c) => {
		c.field('id').integer().primary();
	})
	.collection('test_collection', (c) => {
		c.field('id').integer().primary();
	})
	.build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	// Common setup
	beforeEach(() => {
		vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
	});

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / Collections', () => {
		describe('createOne', () => {
			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.createOne({ collection: 'test_collection' })).rejects.toThrow(ForbiddenError);
			});

			const invalidPayloads: Array<[any, string]> = [
				[{}, 'collection name is missing'],
				[{ collection: '' }, 'collection name is empty'],
				[{ collection: 'directus_test' }, 'collection names start with "directus_"'],
			];

			test.each(invalidPayloads)('should throw InvalidPayloadError when %s', async (payload, _description) => {
				const service = new CollectionsService({ knex: db, schema, accountability: null });
				await expect(service.createOne(payload)).rejects.toThrow(InvalidPayloadError);
			});

			test('should throw InvalidPayloadError for existing collection', async () => {
				tracker.on.select('directus_collections').response([{ collection: 'existing_collection' }]);
				const service = new CollectionsService({ knex: db, schema, accountability: null });

				await expect(service.createOne({ collection: 'existing_collection' })).rejects.toThrow(InvalidPayloadError);
			});

			test('should create collection with schema and default primary key', async () => {
				tracker.on.select('directus_collections').response([]);
				const service = new CollectionsService({ knex: db, schema, accountability: null });

				const result = await service.createOne({
					collection: 'new_collection',
					schema: {},
				});

				expect(result).toBe('new_collection');
				expect(mockSchemaBuilder.createTable).toHaveBeenCalledWith('new_collection', expect.any(Function));
			});

			test('should parse collection name before creating', async () => {
				tracker.on.select('directus_collections').response([]);
				const service = new CollectionsService({ knex: db, schema, accountability: null });

				const parseCollectionNameSpy = vi
					.spyOn(service.helpers.schema, 'parseCollectionName')
					.mockResolvedValue('parsed_collection_name');

				const result = await service.createOne({
					collection: 'ORIGINAL_COLLECTION',
					schema: {},
				});

				expect(parseCollectionNameSpy).toHaveBeenCalledWith('ORIGINAL_COLLECTION');
				expect(result).toBe('parsed_collection_name');
				expect(mockSchemaBuilder.createTable).toHaveBeenCalledWith('parsed_collection_name', expect.any(Function));
			});

			test('should create collection with meta only', async () => {
				tracker.on.select('directus_collections').response([]);

				const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('meta_collection');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.createOne({
					collection: 'meta_collection',
					meta: {
						collection: 'meta_collection',
						hidden: false,
					},
				});

				expect(result).toBe('meta_collection');
				expect(createOneSpy).toHaveBeenCalled();
			});

			test('should create collection with fields', async () => {
				tracker.on.select('directus_collections').response([]);

				const createManySpy = vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1, 2]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.createOne({
					collection: 'fields_collection',
					schema: {},
					fields: [
						{
							field: 'name',
							type: 'string',
							meta: {
								field: 'name',
								collection: 'fields_collection',
							},
						},
					],
				});

				expect(result).toBe('fields_collection');
				expect(createManySpy).toHaveBeenCalled();
			});

			test('should throw InvalidPayloadError when fields is not an array', async () => {
				tracker.on.select('directus_collections').response([]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(
					service.createOne({
						collection: 'invalid_collection',
						schema: {},
						fields: 'not-an-array' as any,
					}),
				).rejects.toThrow(InvalidPayloadError);
			});

			test('should clear cache after creation', async () => {
				tracker.on.select('directus_collections').response([]);
				const clearSpy = vi.fn();

				vi.mocked(cacheModule.getCache).mockReturnValue({
					cache: { clear: clearSpy } as any,
					systemCache: { clear: vi.fn() } as any,
				} as unknown as ReturnType<typeof cacheModule.getCache>);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await service.createOne({
					collection: 'cache_test',
					meta: { collection: 'cache_test' },
				});

				expect(clearSpy).toHaveBeenCalled();
			});

			test('should respect attemptConcurrentIndex option', async () => {
				tracker.on.select('directus_collections').response([]);
				const createTableSpy = vi.fn();

				db.schema.createTable = createTableSpy;

				const addColumnIndexSpy = vi.spyOn(FieldsService.prototype, 'addColumnIndex').mockResolvedValue();

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await service.createOne(
					{
						collection: 'concurrent_index_collection',
						schema: {},
						fields: [
							{
								field: 'name',
								type: 'string',
							},
						],
					},
					{ attemptConcurrentIndex: true } as FieldMutationOptions,
				);

				expect(addColumnIndexSpy).toHaveBeenCalled();
			});
		});

		describe('createMany', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should create multiple collections', async () => {
				const createOneSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.createMany([{ collection: 'collection1' }, { collection: 'collection2' }]);

				expect(result).toEqual(['test', 'test']);
				expect(createOneSpy).toHaveBeenCalledTimes(2);
			});
		});

		describe('readByQuery', () => {
			test('should read collections for admin users', async () => {
				const mockTableInfo = [{ name: 'test_collection' }];
				const mockMeta = [{ collection: 'test_collection' }];

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue(mockMeta as any);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'admin', admin: true } as Accountability,
				});

				service.schemaInspector.tableInfo = vi.fn().mockResolvedValue(mockTableInfo);

				const result = await service.readByQuery();

				// Should have test_collection plus system collections (directus_*)
				expect(result.length).toBeGreaterThan(0);
				expect(result.some((c) => c.collection === 'test_collection')).toBe(true);
			});

			test('should filter collections for non-admin users', async () => {
				const mockTableInfo = [{ name: 'test_collection' }];
				const mockMeta = [{ collection: 'test_collection' }];

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue(mockMeta as any);

				const { fetchAllowedCollections } = await import(
					'../permissions/modules/fetch-allowed-collections/fetch-allowed-collections.js'
				);

				vi.mocked(fetchAllowedCollections).mockResolvedValue(['test_collection']);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				service.schemaInspector.tableInfo = vi.fn().mockResolvedValue(mockTableInfo);

				const result = await service.readByQuery();

				expect(result).toHaveLength(1);
				expect(fetchAllowedCollections).toHaveBeenCalled();
			});

			test('should include collections without meta', async () => {
				const mockTableInfo = [{ name: 'no_meta_collection' }];

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				service.schemaInspector.tableInfo = vi.fn().mockResolvedValue(mockTableInfo);

				const result = await service.readByQuery();

				expect(result.some((c) => c.collection === 'no_meta_collection')).toBe(true);
			});

			test('should respect DB_EXCLUDE_TABLES environment variable', async () => {
				const mockTableInfo = [{ name: 'excluded_table' }, { name: 'included_table' }];

				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

				const { useEnv } = await import('@directus/env');

				vi.mocked(useEnv).mockReturnValue({
					DB_EXCLUDE_TABLES: ['excluded_table'],
				} as any);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				service.schemaInspector.tableInfo = vi.fn().mockResolvedValue(mockTableInfo);

				const result = await service.readByQuery();

				expect(result.some((c) => c.collection === 'excluded_table')).toBe(false);
				expect(result.some((c) => c.collection === 'included_table')).toBe(true);
			});
		});

		describe('readOne', () => {
			test('should throw ForbiddenError when collection not found', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readMany').mockResolvedValue([]);

				await expect(service.readOne('nonexistent')).rejects.toThrow(ForbiddenError);
			});
		});

		describe('readMany', () => {
			test('should validate access for each collection with accountability', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				const { validateAccess } = await import('../permissions/modules/validate-access/validate-access.js');

				vi.spyOn(service, 'readByQuery').mockResolvedValue([{ collection: 'collection1', meta: null, schema: null }]);

				await service.readMany(['collection1']);

				expect(validateAccess).toHaveBeenCalled();
			});
		});

		describe('updateOne', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateOne('test_collection', {})).rejects.toThrow(ForbiddenError);
			});

			test('should update existing collection meta', async () => {
				tracker.on.select('directus_collections').response([{ collection: 'test_collection' }]);

				const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('test_collection');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await service.updateOne('test_collection', {
					meta: { hidden: true },
				} as Partial<Collection>);

				expect(updateOneSpy).toHaveBeenCalled();
			});

			test('should create collection meta if not exists', async () => {
				tracker.on.select('directus_collections').response([]);

				const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('test_collection');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await service.updateOne('test_collection', {
					meta: { collection: 'test_collection', hidden: true },
				} as Partial<Collection>);

				expect(createOneSpy).toHaveBeenCalled();
			});
		});

		describe('updateBatch', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateBatch([])).rejects.toThrow(ForbiddenError);
			});

			test('should throw InvalidPayloadError when data is not an array', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.updateBatch('not-an-array' as any)).rejects.toThrow(InvalidPayloadError);
			});

			test('should throw InvalidPayloadError when collection key is missing', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.updateBatch([{ meta: {} } as any])).rejects.toThrow(InvalidPayloadError);
			});

			test('should update multiple collections', async () => {
				const updateOneSpy = vi.spyOn(CollectionsService.prototype, 'updateOne').mockResolvedValue('test');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.updateBatch([
					{ collection: 'collection1', meta: {} } as Partial<Collection>,
					{ collection: 'collection2', meta: {} } as Partial<Collection>,
				]);

				expect(result).toEqual(['collection1', 'collection2']);
				expect(updateOneSpy).toHaveBeenCalledTimes(2);
			});
		});

		describe('updateMany', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateMany([], {})).rejects.toThrow(ForbiddenError);
			});

			test('should update multiple collections with same data', async () => {
				const updateOneSpy = vi.spyOn(CollectionsService.prototype, 'updateOne').mockResolvedValue('test');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.updateMany(['collection1', 'collection2'], {
					meta: { hidden: true },
				} as Partial<Collection>);

				expect(result).toEqual(['collection1', 'collection2']);
				expect(updateOneSpy).toHaveBeenCalledTimes(2);
			});
		});

		describe('deleteOne', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
				// Setup common tracker responses
				setupSystemCollectionMocks(tracker);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.deleteOne('test_collection')).rejects.toThrow(ForbiddenError);
			});

			test('should throw ForbiddenError when collection does not exist', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readByQuery').mockResolvedValue([]);

				await expect(service.deleteOne('nonexistent')).rejects.toThrow(ForbiddenError);
			});

			test('should delete collection with schema', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readByQuery').mockResolvedValue([
					{
						collection: 'test_collection',
						schema: { name: 'test_collection' },
						meta: { collection: 'test_collection' },
					} as any,
				]);

				await service.deleteOne('test_collection');

				expect(mockSchemaBuilder.dropTable).toHaveBeenCalledWith('test_collection');
			});

			test('should delete collection meta', async () => {
				const deleteOneSpy = vi.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue('test_collection');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readByQuery').mockResolvedValue([
					{
						collection: 'test_collection',
						schema: null,
						meta: { collection: 'test_collection' },
					} as any,
				]);

				await service.deleteOne('test_collection');

				expect(deleteOneSpy).toHaveBeenCalled();
			});

			test('should clear cache after deletion', async () => {
				const clearSpy = vi.fn();

				vi.mocked(cacheModule.getCache).mockReturnValue({
					cache: { clear: clearSpy } as any,
					systemCache: { clear: vi.fn() } as any,
				} as unknown as ReturnType<typeof cacheModule.getCache>);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readByQuery').mockResolvedValue([
					{
						collection: 'test_collection',
						schema: { name: 'test_collection' },
						meta: { collection: 'test_collection' },
					} as any,
				]);

				await service.deleteOne('test_collection');

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('deleteMany', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.deleteMany([])).rejects.toThrow(ForbiddenError);
			});

			test('should delete multiple collections', async () => {
				const deleteOneSpy = vi.spyOn(CollectionsService.prototype, 'deleteOne').mockResolvedValue('test');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.deleteMany(['collection1', 'collection2']);

				expect(result).toEqual(['collection1', 'collection2']);
				expect(deleteOneSpy).toHaveBeenCalledTimes(2);
			});
		});
	});
});
