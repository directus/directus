import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, Collection, FieldMutationOptions } from '@directus/types';
import knex from 'knex';
import { MockClient, createTracker } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as cacheModule from '../cache.js';
import * as getSchemaModule from '../utils/get-schema.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
	getSchemaInspector: vi.fn(),
}));

vi.mock('@directus/schema', () => ({
	createInspector: vi.fn().mockReturnValue({
		tableInfo: vi.fn().mockResolvedValue([]),
		columnInfo: vi.fn().mockResolvedValue([]),
		primary: vi.fn().mockResolvedValue('id'),
		foreignKeys: vi.fn().mockResolvedValue([]),
		withSchema: vi.fn().mockReturnThis(),
	}),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({}),
}));

vi.mock('../cache.js', () => ({
	getCache: vi.fn().mockReturnValue({
		cache: {
			clear: vi.fn(),
		},
		systemCache: {
			clear: vi.fn(),
		},
	}),
	clearSystemCache: vi.fn(),
}));

vi.mock('../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
	},
}));

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

vi.mock('../utils/transaction.js', () => ({
	transaction: vi.fn((knex, callback) => callback(knex)),
}));

vi.mock('./items.js', () => {
	const ItemsService = vi.fn();
	ItemsService.prototype.createOne = vi.fn();
	ItemsService.prototype.createMany = vi.fn();
	ItemsService.prototype.readByQuery = vi.fn();
	ItemsService.prototype.readOne = vi.fn();
	ItemsService.prototype.readMany = vi.fn();
	ItemsService.prototype.updateOne = vi.fn();
	ItemsService.prototype.updateMany = vi.fn();
	ItemsService.prototype.updateByQuery = vi.fn();
	ItemsService.prototype.deleteOne = vi.fn();
	ItemsService.prototype.deleteMany = vi.fn();
	ItemsService.prototype.deleteByQuery = vi.fn();
	return { ItemsService };
});

vi.mock('./fields.js', () => {
	const FieldsService = vi.fn();
	FieldsService.prototype.addColumnToTable = vi.fn();
	FieldsService.prototype.addColumnIndex = vi.fn();
	FieldsService.prototype.deleteField = vi.fn();
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

// Import after mocks
import { CollectionsService } from './collections.js';
import { FieldsService } from './fields.js';
import { ItemsService } from './items.js';

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
	const db = vi.mocked(knex.default({ client: MockClient }));
	const tracker = createTracker(db);

	// Mock schema builder methods
	const mockSchema = {
		createTable: vi.fn().mockResolvedValue(undefined),
		dropTable: vi.fn().mockResolvedValue(undefined),
		hasTable: vi.fn().mockResolvedValue(false),
		table: vi.fn().mockResolvedValue(undefined),
	};

	Object.defineProperty(db, 'schema', {
		get: () => mockSchema,
		configurable: true,
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
		mockSchema.createTable.mockClear();
		mockSchema.dropTable.mockClear();
		mockSchema.hasTable.mockClear();
		mockSchema.table.mockClear();
	});

	describe('Services / Collections', () => {
		describe('Constructor', () => {
			it('should initialize with required dependencies', () => {
				const service = new CollectionsService({
					knex: db,
					schema,
				});

				expect(service.knex).toBe(db);
				expect(service.schema).toBe(schema);
				expect(service.accountability).toBe(null);
			});

			it('should initialize with accountability', () => {
				const accountability = { role: 'test-role', admin: true } as Accountability;

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability,
				});

				expect(service.accountability).toBe(accountability);
			});
		});

		describe('createOne', () => {
			beforeEach(() => {
				vi.spyOn(FieldsService.prototype, 'addColumnToTable').mockImplementation(vi.fn());
				vi.spyOn(ItemsService.prototype, 'createMany').mockResolvedValue([1]);
				vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				const payload = {
					collection: 'test_collection',
				};

				await expect(service.createOne(payload)).rejects.toThrow(ForbiddenError);
			});

			it('should throw InvalidPayloadError when collection name is missing', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.createOne({} as any)).rejects.toThrow(InvalidPayloadError);
			});

			it('should throw InvalidPayloadError when collection name is empty', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.createOne({ collection: '' })).rejects.toThrow(InvalidPayloadError);
			});

			it('should throw InvalidPayloadError for collection names starting with "directus_"', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.createOne({ collection: 'directus_test' })).rejects.toThrow(InvalidPayloadError);
			});

			it('should throw InvalidPayloadError for existing collection', async () => {
				tracker.on.select('directus_collections').response([{ collection: 'existing_collection' }]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.createOne({ collection: 'existing_collection' })).rejects.toThrow(InvalidPayloadError);
			});

			it('should create collection with schema and default primary key', async () => {
				tracker.on.select('directus_collections').response([]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.createOne({
					collection: 'new_collection',
					schema: {},
				});

				expect(result).toBe('new_collection');
				expect(mockSchema.createTable).toHaveBeenCalledWith('new_collection', expect.any(Function));
			});

			it('should create collection with meta only', async () => {
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

			it('should create collection with fields', async () => {
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

			it('should throw InvalidPayloadError when fields is not an array', async () => {
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

			it('should inject primary key field when none provided', async () => {
				tracker.on.select('directus_collections').response([]);

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await service.createOne({
					collection: 'no_pk_collection',
					schema: {},
					fields: [],
				});

				// const createManySpy = vi.spyOn(ItemsService.prototype, 'createMany');
				// The injected primary key should be added
				expect(mockSchema.createTable).toHaveBeenCalled();
			});

			it('should clear cache after creation', async () => {
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

			it('should respect attemptConcurrentIndex option', async () => {
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
				vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should create multiple collections', async () => {
				const createOneSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');

				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.createMany([
					{ collection: 'collection1' },
					{ collection: 'collection2' },
				]);

				expect(result).toEqual(['test', 'test']);
				expect(createOneSpy).toHaveBeenCalledTimes(2);
			});

			it('should clear cache after creating many', async () => {
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

				await service.createMany([{ collection: 'collection1' }]);

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('readByQuery', () => {
			beforeEach(() => {
				vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);
			});

			it('should read collections for admin users', async () => {
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

			it('should filter collections for non-admin users', async () => {
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

			it('should include collections without meta', async () => {
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

			it('should respect DB_EXCLUDE_TABLES environment variable', async () => {
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
			it('should read a single collection', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const mockCollection = {
					collection: 'test_collection',
					meta: null,
					schema: null,
				};

				vi.spyOn(service, 'readMany').mockResolvedValue([mockCollection]);

				const result = await service.readOne('test_collection');

				expect(result).toEqual(mockCollection);
			});

			it('should throw ForbiddenError when collection not found', async () => {
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
			it('should read multiple collections by keys', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const mockCollections = [
					{ collection: 'collection1', meta: null, schema: null },
					{ collection: 'collection2', meta: null, schema: null },
				];

				vi.spyOn(service, 'readByQuery').mockResolvedValue(mockCollections);

				const result = await service.readMany(['collection1', 'collection2']);

				expect(result).toHaveLength(2);
			});

			it('should validate access for each collection with accountability', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				const { validateAccess } = await import('../permissions/modules/validate-access/validate-access.js');

				vi.spyOn(service, 'readByQuery').mockResolvedValue([
					{ collection: 'collection1', meta: null, schema: null },
				]);

				await service.readMany(['collection1']);

				expect(validateAccess).toHaveBeenCalled();
			});
		});

		describe('updateOne', () => {
			beforeEach(() => {
				vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('test_collection');
				vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateOne('test_collection', {})).rejects.toThrow(ForbiddenError);
			});

			it('should return early when no meta provided', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				const result = await service.updateOne('test_collection', {});

				expect(result).toBe('test_collection');
			});

			it('should update existing collection meta', async () => {
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

			it('should create collection meta if not exists', async () => {
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

			it('should clear cache after update', async () => {
				tracker.on.select('directus_collections').response([{ collection: 'test_collection' }]);

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

				await service.updateOne('test_collection', {
					meta: { hidden: true },
				} as Partial<Collection>);

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('updateBatch', () => {
			beforeEach(() => {
				vi.spyOn(CollectionsService.prototype, 'updateOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateBatch([])).rejects.toThrow(ForbiddenError);
			});

			it('should throw InvalidPayloadError when data is not an array', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.updateBatch('not-an-array' as any)).rejects.toThrow(InvalidPayloadError);
			});

			it('should throw InvalidPayloadError when collection key is missing', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				await expect(service.updateBatch([{ meta: {} } as any])).rejects.toThrow(InvalidPayloadError);
			});

			it('should update multiple collections', async () => {
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

			it('should clear cache after batch update', async () => {
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

				await service.updateBatch([{ collection: 'collection1', meta: {} } as Partial<Collection>]);

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('updateMany', () => {
			beforeEach(() => {
				vi.spyOn(CollectionsService.prototype, 'updateOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.updateMany([], {})).rejects.toThrow(ForbiddenError);
			});

			it('should update multiple collections with same data', async () => {
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

			it('should clear cache after updating many', async () => {
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

				await service.updateMany(['collection1'], { meta: { hidden: true } } as Partial<Collection>);

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('deleteOne', () => {
			beforeEach(() => {
				vi.spyOn(FieldsService.prototype, 'deleteField').mockResolvedValue(undefined as any);
				vi.spyOn(ItemsService.prototype, 'deleteOne').mockResolvedValue('collection');
				vi.spyOn(ItemsService.prototype, 'deleteByQuery').mockResolvedValue(['field']);
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);

				// Setup common tracker responses
				tracker.on.update('directus_collections').response([]);
				tracker.on.update('directus_relations').response([]);
				tracker.on.select('directus_revisions').response([]);
				tracker.on.update('directus_revisions').response([]);
				tracker.on.delete('directus_revisions').response([]);
				tracker.on.delete('directus_presets').response([]);
				tracker.on.delete('directus_activity').response([]);
				tracker.on.delete('directus_permissions').response([]);
				tracker.on.delete('directus_relations').response([]);
				tracker.on.select('directus_collections').response([]);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.deleteOne('test_collection')).rejects.toThrow(ForbiddenError);
			});

			it('should throw ForbiddenError when collection does not exist', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'readByQuery').mockResolvedValue([]);

				await expect(service.deleteOne('nonexistent')).rejects.toThrow(ForbiddenError);
			});

			it('should delete collection with schema', async () => {
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

				expect(mockSchema.dropTable).toHaveBeenCalledWith('test_collection');
			});

			it('should delete collection meta', async () => {
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

			it('should clear references to deleted collection as group', async () => {
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

				// Should update collections that use this as a group
				expect(tracker.history.update.length).toBeGreaterThan(0);
			});

			it('should clear cache after deletion', async () => {
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
				vi.spyOn(CollectionsService.prototype, 'deleteOne').mockResolvedValue('test_collection');
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			it('should throw ForbiddenError for non-admin users', async () => {
				const service = new CollectionsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.deleteMany([])).rejects.toThrow(ForbiddenError);
			});

			it('should delete multiple collections', async () => {
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

			it('should clear cache after deleting many', async () => {
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

				await service.deleteMany(['collection1']);

				expect(clearSpy).toHaveBeenCalled();
			});
		});
	});
});
