import { useEnv } from '@directus/env';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability, DeferredIndex, Field, RawField } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as cacheModule from '../cache.js';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import {
	createMockKnex,
	createMockTableBuilder,
	mockAlterTable,
	mockSchemaTable,
	resetKnexMocks,
	setupSystemCollectionMocks,
} from '../test-utils/knex.js';
import * as getSchemaModule from '../utils/get-schema.js';
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

vi.mock('../permissions/lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockResolvedValue([]),
}));

vi.mock('../permissions/lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockResolvedValue([
		{
			collection: 'test_collection',
			fields: ['*'],
		},
	]),
}));

vi.mock('../permissions/modules/validate-access/validate-access.js', () => ({
	validateAccess: vi.fn(),
}));

vi.mock('../utils/should-clear-cache.js', () => ({
	shouldClearCache: vi.fn().mockReturnValue(true),
}));

const mockCreateIndexSpy = vi.fn().mockResolvedValue(undefined);

vi.mock('../database/helpers/index.js', () => ({
	getHelpers: vi.fn(() => ({
		schema: {
			createIndex: mockCreateIndexSpy,
			processFieldType: vi.fn((field) => field.type),
			preColumnChange: vi.fn().mockResolvedValue(true),
			postColumnChange: vi.fn().mockResolvedValue(undefined),
			setNullable: vi.fn(),
			generateIndexName: vi.fn((type, collection, field) => `${collection}_${field}_${type}`),
		},
		date: {
			fieldFlagForField: vi.fn().mockReturnValue(null),
		},
		st: {
			createColumn: vi.fn((_table, _field) => ({
				defaultTo: vi.fn().mockReturnThis(),
				notNullable: vi.fn().mockReturnThis(),
				nullable: vi.fn().mockReturnThis(),
				unique: vi.fn().mockReturnThis(),
				index: vi.fn().mockReturnThis(),
				primary: vi.fn().mockReturnThis(),
			})),
		},
	})),
}));

const schema = new SchemaBuilder()
	.collection('directus_fields', (c) => {
		c.field('id').integer().primary();
		c.field('collection').string();
		c.field('field').string();
	})
	.collection('test_collection', (c) => {
		c.field('id').integer().primary();
		c.field('name').string();
		c.field('email').string();
	})
	.build();

describe('Integration Tests', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	describe('Services / Fields', () => {
		describe('columnInfo', () => {
			beforeEach(() => {
				vi.mocked(cacheModule.getCacheValue).mockResolvedValue(null);
			});

			test('should return all column info when no collection specified', async () => {
				const mockColumns = [
					{ table: 'test_collection', name: 'id', data_type: 'integer' },
					{ table: 'test_collection', name: 'name', data_type: 'varchar' },
				];

				const service = new FieldsService({
					knex: db,
					schema,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue(mockColumns);

				const result = await service.columnInfo();

				expect(result).toEqual(mockColumns);
			});

			test('should filter column info by collection', async () => {
				const mockColumns = [
					{ table: 'test_collection', name: 'id', data_type: 'integer' },
					{ table: 'other_collection', name: 'id', data_type: 'integer' },
				];

				const service = new FieldsService({
					knex: db,
					schema,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue(mockColumns);

				const result = await service.columnInfo('test_collection');

				expect(result).toHaveLength(1);
				expect(result[0]?.table).toBe('test_collection');
			});

			test('should return single column when collection and field specified', async () => {
				const mockColumns = [
					{ table: 'test_collection', name: 'id', data_type: 'integer' },
					{ table: 'test_collection', name: 'name', data_type: 'varchar' },
				];

				const service = new FieldsService({
					knex: db,
					schema,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue(mockColumns);

				const result = await service.columnInfo('test_collection', 'name');

				expect(result).toEqual({ table: 'test_collection', name: 'name', data_type: 'varchar' });
			});

			test('should use cache when available', async () => {
				const mockColumns = [{ table: 'test_collection', name: 'id', data_type: 'integer' }];

				vi.mocked(cacheModule.getCacheValue).mockResolvedValueOnce(mockColumns);

				vi.mocked(useEnv).mockReturnValue({
					CACHE_SCHEMA: true,
				});

				// Re-import FieldsService to pick up the new env mock
				vi.resetModules();
				const { FieldsService: FieldsServiceWithCache } = await import('./fields.js');

				const service = new FieldsServiceWithCache({
					knex: db,
					schema,
				});

				const result = await service.columnInfo();

				expect(result).toEqual(mockColumns);
			});
		});

		describe('readAll', () => {
			test('should read all fields for admin users', async () => {
				const mockColumns = [
					{
						table: 'test_collection',
						name: 'id',
						data_type: 'integer',
						default_value: null,
						is_nullable: false,
					},
				];

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'admin', admin: true } as Accountability,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue(mockColumns);

				tracker.on.select('directus_fields').response([]);

				const result = await service.readAll('test_collection');

				expect(result.length).toBeGreaterThan(0);
				expect(result.every((field) => field.collection === 'test_collection')).toBe(true);
			});

			test('should throw ForbiddenError for non-admin users without access', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([]);

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue([]);

				tracker.on.select('directus_fields').response([]);

				await expect(service.readAll('test_collection')).rejects.toThrow(ForbiddenError);
			});
		});

		describe('readOne', () => {
			test('should read a single field', async () => {
				const mockColumn = {
					table: 'test_collection',
					name: 'name',
					data_type: 'varchar',
					default_value: null,
					is_nullable: true,
				};

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue([mockColumn]);

				tracker.on.select('directus_fields').response([]);

				const result = await service.readOne('test_collection', 'name');

				expect(result['collection']).toBe('test_collection');
				expect(result['field']).toBe('name');
			});

			test('should throw ForbiddenError when field not found', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				service.schemaInspector.columnInfo = vi.fn().mockRejectedValue(new Error('Column not found'));

				tracker.on.select('directus_fields').response([]);

				await expect(service.readOne('test_collection', 'nonexistent')).rejects.toThrow(ForbiddenError);
			});

			test('should throw ForbiddenError for non-admin users without access', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						collection: 'test_collection',
						fields: ['id'],
						permissions: null,
						validation: null,
						presets: undefined,
						policy: null,
						action: 'read',
					},
				]);

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				tracker.on.select('directus_fields').response([]);

				await expect(service.readOne('test_collection', 'name')).rejects.toThrow(ForbiddenError);
			});
		});

		describe('createField', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				const field = {
					field: 'new_field',
					type: 'string' as const,
				};

				await expect(service.createField('test_collection', field)).rejects.toThrow(ForbiddenError);
			});

			test('should throw InvalidPayloadError when field already exists', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([{ id: 1 }]);

				const field = {
					field: 'id',
					type: 'integer' as const,
				};

				await expect(service.createField('test_collection', field)).rejects.toThrow(InvalidPayloadError);
			});

			test('should create a field with meta', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);
				tracker.on.select('max').response([{ max: 1 }]);
				// Mock any DDL queries
				tracker.on.any(/alter table/i).response([]);

				// Mock alterTable for non-alias fields
				db.schema.alterTable = mockAlterTable() as any;

				const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);

				const field: Partial<Field> & { field: string; type: 'string' } = {
					field: 'new_field',
					type: 'string',
					meta: {
						collection: 'test_collection',
						field: 'new_field',
						special: null,
						interface: null,
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: null,
						width: 'full',
						translations: null,
						note: null,
						conditions: null,
						required: false,
						group: null,
						validation: null,
						validation_message: null,
						id: 0,
					},
				};

				await service.createField('test_collection', field);

				expect(createOneSpy).toHaveBeenCalled();
			});

			test('should not create schema column for alias fields', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);
				tracker.on.select('max').response([{ max: 1 }]);

				const alterTableSpy = vi.fn();
				db.schema.alterTable = alterTableSpy;

				const field: Partial<Field> & { field: string; type: 'alias' } = {
					field: 'alias_field',
					type: 'alias',
					meta: {
						collection: 'test_collection',
						field: 'alias_field',
						special: ['alias'],
						interface: null,
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: null,
						width: 'full',
						translations: null,
						note: null,
						conditions: null,
						required: false,
						group: null,
						validation: null,
						validation_message: null,
						id: 0,
					},
				};

				await service.createField('test_collection', field);

				expect(alterTableSpy).not.toHaveBeenCalled();
			});

			test('should push to deferredIndexes instead of calling addColumnIndex when deferredIndexes is provided', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);
				tracker.on.select('max').response([{ max: 1 }]);

				db.schema.alterTable = mockAlterTable() as any;
				vi.spyOn(service, 'addColumnToTable').mockImplementation(() => {});

				const addColumnIndexSpy = vi.spyOn(service, 'addColumnIndex').mockResolvedValue();

				const field: Partial<Field> & { field: string; type: 'string' } = {
					field: 'new_field',
					type: 'string',
				};

				const deferredIndexes: DeferredIndex[] = [];

				await service.createField('test_collection', field, undefined, {
					attemptConcurrentIndex: true,
					deferredIndexes,
				});

				expect(addColumnIndexSpy).not.toHaveBeenCalled();
				expect(deferredIndexes).toHaveLength(1);

				expect(deferredIndexes[0]).toEqual(
					expect.objectContaining({
						collection: 'test_collection',
					}),
				);
			});

			test('should clear cache after field creation', async () => {
				const clearSpy = vi.fn();

				vi.mocked(cacheModule.getCache).mockReturnValue({
					cache: { clear: clearSpy } as any,
					systemCache: { clear: vi.fn() } as any,
					localSchemaCache: { get: vi.fn(), set: vi.fn() } as any,
					lockCache: undefined,
				} as unknown as ReturnType<typeof cacheModule.getCache>);

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);
				tracker.on.select('max').response([{ max: 1 }]);
				// Mock any DDL queries
				tracker.on.any(/alter table/i).response([]);

				// Mock alterTable for field creation
				db.schema.alterTable = mockAlterTable() as any;

				const field: Partial<Field> & { field: string; type: 'string' } = {
					field: 'new_field',
					type: 'string',
				};

				await service.createField('test_collection', field);

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('updateField', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				const field: RawField = {
					field: 'name',
					type: 'string',
				};

				await expect(service.updateField('test_collection', field)).rejects.toThrow(ForbiddenError);
			});

			test('should throw InvalidPayloadError when changing alias type', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);

				// Create schema with an alias field (no actual column)
				const schemaWithAlias = {
					...schema,
					collections: {
						...schema.collections,
						test_collection: {
							...schema.collections['test_collection'],
							fields: {
								...schema.collections['test_collection']?.fields,
								alias_field: {
									field: 'alias_field',
									type: 'alias',
									alias: true,
								},
							},
						},
					},
				};

				service.schema = schemaWithAlias as any;

				const field: RawField = {
					field: 'alias_field',
					type: 'string',
				};

				await expect(service.updateField('test_collection', field)).rejects.toThrow(InvalidPayloadError);
			});

			test('should throw InvalidPayloadError when making primary key nullable', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				const mockColumn = {
					table: 'test_collection',
					name: 'id',
					data_type: 'integer',
					default_value: null,
					max_length: null,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: false,
					is_unique: true,
					is_indexed: true,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue([mockColumn]);

				tracker.on.select('directus_fields').response([]);

				const field: RawField = {
					field: 'id',
					type: 'integer',
					schema: {
						...mockColumn,
						is_nullable: true,
					},
				};

				await expect(service.updateField('test_collection', field)).rejects.toThrow(InvalidPayloadError);
			});

			test('should update field meta', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([{ id: 1, collection: 'test_collection', field: 'name' }]);

				const updateOneSpy = vi.spyOn(ItemsService.prototype, 'updateOne').mockResolvedValue('name');

				const field: RawField = {
					field: 'name',
					type: 'string',
					meta: {
						collection: 'test_collection',
						field: 'name',
						special: null,
						interface: 'input',
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 1,
						width: 'full',
						translations: null,
						note: 'Updated note',
						conditions: null,
						required: false,
						group: null,
						validation: null,
						validation_message: null,
					},
				};

				await service.updateField('test_collection', field);

				expect(updateOneSpy).toHaveBeenCalled();
			});

			test('should create meta if not exists', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				tracker.on.select('directus_fields').response([]);

				const createOneSpy = vi.spyOn(ItemsService.prototype, 'createOne').mockResolvedValue(1);

				const field: RawField = {
					field: 'name',
					type: 'string',
					meta: {
						collection: 'test_collection',
						field: 'name',
						special: null,
						interface: 'input',
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: 1,
						width: 'full',
						translations: null,
						note: null,
						conditions: null,
						required: false,
						group: null,
						validation: null,
						validation_message: null,
					},
				};

				await service.updateField('test_collection', field);

				expect(createOneSpy).toHaveBeenCalled();
			});

			test('should push to deferredIndexes instead of calling addColumnIndex when deferredIndexes is provided', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				const existingColumn = {
					name: 'name',
					table: 'test_collection',
					data_type: 'varchar',
					default_value: null,
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: true,
					is_unique: false,
					is_indexed: false,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				service.schemaInspector.columnInfo = vi.fn().mockResolvedValue([existingColumn]);
				tracker.on.select('directus_fields').response([]);

				db.schema.alterTable = mockAlterTable() as any;
				vi.spyOn(service, 'addColumnToTable').mockImplementation(() => {});

				const addColumnIndexSpy = vi.spyOn(service, 'addColumnIndex').mockResolvedValue();

				const field: RawField = {
					field: 'name',
					type: 'string',
					schema: {
						...existingColumn,
						max_length: 500,
					},
				};

				const deferredIndexes: DeferredIndex[] = [];

				await service.updateField('test_collection', field, {
					attemptConcurrentIndex: true,
					deferredIndexes,
				});

				expect(addColumnIndexSpy).not.toHaveBeenCalled();
				expect(deferredIndexes).toHaveLength(1);

				expect(deferredIndexes[0]).toEqual(
					expect.objectContaining({
						collection: 'test_collection',
						field,
						existing: existingColumn,
					}),
				);
			});
		});

		describe('updateFields', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
			});

			test('should update multiple fields', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'updateField').mockResolvedValue('field');

				const fields: RawField[] = [
					{ field: 'name', type: 'string' },
					{ field: 'email', type: 'string' },
				];

				const result = await service.updateFields('test_collection', fields);

				expect(result).toEqual(['field', 'field']);
				expect(service.updateField).toHaveBeenCalledTimes(2);
			});

			test('should clear cache after updating fields', async () => {
				const clearSpy = vi.fn();

				vi.mocked(cacheModule.getCache).mockReturnValue({
					cache: { clear: clearSpy } as any,
					systemCache: { clear: vi.fn() } as any,
					localSchemaCache: { get: vi.fn(), set: vi.fn() } as any,
					lockCache: undefined,
				} as unknown as ReturnType<typeof cacheModule.getCache>);

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				vi.spyOn(service, 'updateField').mockResolvedValue('field');

				const fields: RawField[] = [{ field: 'name', type: 'string' }];

				await service.updateFields('test_collection', fields);

				expect(clearSpy).toHaveBeenCalled();
			});

			test('should propagate deferredIndexes to updateField', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				const updateFieldSpy = vi.spyOn(service, 'updateField').mockResolvedValue('field');

				const deferredIndexes: DeferredIndex[] = [];

				const fields: RawField[] = [
					{ field: 'name', type: 'string' },
					{ field: 'email', type: 'string' },
				];

				await service.updateFields('test_collection', fields, {
					attemptConcurrentIndex: true,
					deferredIndexes,
				});

				expect(updateFieldSpy).toHaveBeenCalledTimes(2);

				for (const call of updateFieldSpy.mock.calls) {
					const opts = call[2];

					expect(opts).toEqual(
						expect.objectContaining({
							attemptConcurrentIndex: true,
							deferredIndexes,
						}),
					);
				}
			});
		});

		describe('deleteField', () => {
			beforeEach(() => {
				vi.mocked(getSchemaModule.getSchema).mockResolvedValue(schema);
				setupSystemCollectionMocks(tracker);
			});

			test('should throw ForbiddenError for non-admin users', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: { role: 'test', admin: false } as Accountability,
				});

				await expect(service.deleteField('test_collection', 'name')).rejects.toThrow(ForbiddenError);
			});

			test('should delete field meta', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				// Override default empty response with specific field data
				tracker.on.select('directus_fields').response([{ collection: 'test_collection', field: 'name' }]);
				// Mock any DDL queries
				tracker.on.any(/alter table/i).response([]);

				const deleteByQuerySpy = vi.spyOn(ItemsService.prototype, 'deleteByQuery').mockResolvedValue([]);

				db.schema.table = mockSchemaTable() as any;

				await service.deleteField('test_collection', 'name');

				expect(deleteByQuerySpy).toHaveBeenCalled();
			});

			test('should clear cache after deletion', async () => {
				const clearSpy = vi.fn();

				vi.mocked(cacheModule.getCache).mockReturnValue({
					cache: { clear: clearSpy } as any,
					systemCache: { clear: vi.fn() } as any,
					localSchemaCache: { get: vi.fn(), set: vi.fn() } as any,
					lockCache: undefined,
				} as unknown as ReturnType<typeof cacheModule.getCache>);

				const service = new FieldsService({
					knex: db,
					schema,
					accountability: null,
				});

				// Override default empty response with specific field data
				tracker.on.select('directus_fields').response([{ collection: 'test_collection', field: 'name' }]);
				// Mock any DDL queries
				tracker.on.any(/alter table/i).response([]);

				db.schema.table = mockSchemaTable() as any;

				await service.deleteField('test_collection', 'name');

				expect(clearSpy).toHaveBeenCalled();
			});
		});

		describe('addColumnIndex', () => {
			beforeEach(() => {
				mockCreateIndexSpy.mockClear();
			});

			test('should not add index for alias fields', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'alias_field',
					type: 'alias',
					schema: null,
					meta: null,
					name: '',
				};

				await expect(service.addColumnIndex('test_collection', field)).resolves.not.toThrow();
			});

			test('should not add index for primary key fields', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'id',
					type: 'integer',
					schema: {
						name: 'id',
						table: 'test_collection',
						data_type: 'integer',
						default_value: null,
						max_length: null,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: false,
						is_unique: true,
						is_indexed: true,
						is_primary_key: true,
						has_auto_increment: true,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				await expect(service.addColumnIndex('test_collection', field)).resolves.not.toThrow();
			});

			test('should not add index when existing column is primary key', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'id',
					type: 'integer',
					schema: {
						name: 'id',
						table: 'test_collection',
						data_type: 'integer',
						default_value: null,
						max_length: null,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: false,
						is_unique: false,
						is_indexed: false,
						is_primary_key: false,
						has_auto_increment: true,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				const existingColumn = {
					name: 'id',
					table: 'test_collection',
					data_type: 'integer',
					default_value: null,
					max_length: null,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: false,
					is_unique: true,
					is_indexed: true,
					is_primary_key: true,
					has_auto_increment: true,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				await expect(
					service.addColumnIndex('test_collection', field, { existing: existingColumn }),
				).resolves.not.toThrow();
			});

			test('should create unique index when field schema is_unique is true', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'email',
					type: 'string',
					schema: {
						name: 'email',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: true,
						is_indexed: false,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				await service.addColumnIndex('test_collection', field);

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'email', {
					unique: true,
					attemptConcurrentIndex: false,
				});
			});

			test('should create regular index when field schema is_indexed is true', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'name',
					type: 'string',
					schema: {
						name: 'name',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: false,
						is_indexed: true,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				await service.addColumnIndex('test_collection', field);

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'name', {
					unique: false,
					attemptConcurrentIndex: false,
				});
			});

			test('should create unique index with concurrent flag when attemptConcurrentIndex is true', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'email',
					type: 'string',
					schema: {
						name: 'email',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: true,
						is_indexed: false,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				await service.addColumnIndex('test_collection', field, { attemptConcurrentIndex: true });

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'email', {
					unique: true,
					attemptConcurrentIndex: true,
				});
			});

			test('should not create unique index when existing column already has unique constraint', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'email',
					type: 'string',
					schema: {
						name: 'email',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: true,
						is_indexed: false,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				const existingColumn = {
					name: 'email',
					table: 'test_collection',
					data_type: 'varchar',
					default_value: null,
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: true,
					is_unique: true,
					is_indexed: false,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				await service.addColumnIndex('test_collection', field, { existing: existingColumn });

				expect(mockCreateIndexSpy).not.toHaveBeenCalled();
			});

			test('should not create regular index when existing column already has index', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'name',
					type: 'string',
					schema: {
						name: 'name',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: false,
						is_indexed: true,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				const existingColumn = {
					name: 'name',
					table: 'test_collection',
					data_type: 'varchar',
					default_value: null,
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: true,
					is_unique: false,
					is_indexed: true,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				await service.addColumnIndex('test_collection', field, { existing: existingColumn });

				expect(mockCreateIndexSpy).not.toHaveBeenCalled();
			});

			test('should create index when existing column does not have index but new field does', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'name',
					type: 'string',
					schema: {
						name: 'name',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: false,
						is_indexed: true,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				const existingColumn = {
					name: 'name',
					table: 'test_collection',
					data_type: 'varchar',
					default_value: null,
					max_length: 255,
					numeric_precision: null,
					numeric_scale: null,
					is_generated: false,
					generation_expression: null,
					is_nullable: true,
					is_unique: false,
					is_indexed: false,
					is_primary_key: false,
					has_auto_increment: false,
					foreign_key_column: null,
					foreign_key_table: null,
				};

				await service.addColumnIndex('test_collection', field, { existing: existingColumn });

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'name', {
					unique: false,
					attemptConcurrentIndex: false,
				});
			});

			test('should create both unique and regular indexes when both are needed', async () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const field: Field = {
					collection: 'test_collection',
					field: 'email',
					type: 'string',
					schema: {
						name: 'email',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: true,
						is_indexed: true,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				await service.addColumnIndex('test_collection', field);

				expect(mockCreateIndexSpy).toHaveBeenCalledTimes(2);

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'email', {
					unique: true,
					attemptConcurrentIndex: false,
				});

				expect(mockCreateIndexSpy).toHaveBeenCalledWith('test_collection', 'email', {
					unique: false,
					attemptConcurrentIndex: false,
				});
			});
		});

		describe('addColumnToTable', () => {
			test('should not add column for alias fields', () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const table = {
					string: vi.fn(),
				};

				const field: Field = {
					collection: 'test_collection',
					field: 'alias_field',
					type: 'alias',
					schema: null,
					meta: null,
					name: '',
				};

				service.addColumnToTable(table as any, 'test_collection', field);

				expect(table.string).not.toHaveBeenCalled();
			});

			test('should add string column', () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const columnBuilder = {
					defaultTo: vi.fn().mockReturnThis(),
					notNullable: vi.fn().mockReturnThis(),
					nullable: vi.fn().mockReturnThis(),
					unique: vi.fn().mockReturnThis(),
					index: vi.fn().mockReturnThis(),
					primary: vi.fn().mockReturnThis(),
				};

				const table = {
					string: vi.fn().mockReturnValue(columnBuilder),
				};

				const field: Field = {
					collection: 'test_collection',
					field: 'name',
					type: 'string',
					schema: {
						name: 'name',
						table: 'test_collection',
						data_type: 'varchar',
						default_value: null,
						max_length: 255,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: true,
						is_unique: false,
						is_indexed: false,
						is_primary_key: false,
						has_auto_increment: false,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				service.addColumnToTable(table as any, 'test_collection', field);

				expect(table.string).toHaveBeenCalledWith('name', 255);
			});

			test('should add integer column with auto increment', () => {
				const service = new FieldsService({
					knex: db,
					schema,
				});

				const columnBuilder = {
					...createMockTableBuilder(),
					notNullable: vi.fn().mockReturnThis(),
					primary: vi.fn().mockReturnThis(),
				};

				const table = {
					...createMockTableBuilder(),
					increments: vi.fn().mockReturnValue(columnBuilder),
				};

				const field: Field = {
					collection: 'test_collection',
					field: 'id',
					type: 'integer',
					schema: {
						name: 'id',
						table: 'test_collection',
						data_type: 'integer',
						default_value: null,
						max_length: null,
						numeric_precision: null,
						numeric_scale: null,
						is_generated: false,
						generation_expression: null,
						is_nullable: false,
						is_unique: true,
						is_indexed: true,
						is_primary_key: true,
						has_auto_increment: true,
						foreign_key_column: null,
						foreign_key_table: null,
					},
					meta: null,
					name: '',
				};

				service.addColumnToTable(table as any, 'test_collection', field);

				expect(table.increments).toHaveBeenCalledWith('id');
				expect(columnBuilder.primary).toHaveBeenCalled();
			});
		});
	});
});
