import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import type { MockedFunction } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { snapshotApplyTestSchema } from '../__utils__/schemas.js';
import {
	snapshotBeforeCreateCollection,
	snapshotBeforeDeleteCollection,
	snapshotCreateCollection,
	snapshotCreateCollectionNotNested,
} from '../__utils__/snapshots.js';
import { CollectionsService, FieldsService } from '../services/index.js';
import type { Snapshot, SnapshotField } from '../types/index.js';
import { applySnapshot } from './apply-snapshot.js';
import * as getSchema from './get-schema.js';

class Client_PG extends MockClient {}

describe('applySnapshot', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	const mutationOptions = {
		autoPurgeSystemCache: false,
		bypassEmitAction: expect.any(Function),
		bypassLimits: true,
	};

	beforeEach(() => {
		db = vi.mocked(knex.default({ client: Client_PG }));
		tracker = createTracker(db);
	});

	afterEach(() => {
		tracker.reset();
		vi.clearAllMocks();
	});

	describe('Creating new collection(s)', () => {
		it('Creates new top-level collection(s)', async () => {
			const expected = {
				collection: 'test_table_2',
				meta: {
					accountability: 'all',
					collection: 'test_table_2',
					group: null,
					hidden: true,
					icon: 'import_export',
					item_duplication_fields: null,
					note: null,
					singleton: false,
					translations: {},
					versioning: false,
				},
				schema: { name: 'test_table_2' },
				fields: [
					{
						collection: 'test_table_2',
						field: 'id',
						meta: {
							collection: 'test_table_2',
							conditions: null,
							display: null,
							display_options: null,
							field: 'id',
							group: null,
							hidden: true,
							interface: null,
							note: null,
							options: null,
							readonly: false,
							required: false,
							sort: null,
							special: null,
							translations: {},
							validation: null,
							validation_message: null,
							width: 'full',
						},
						schema: {
							data_type: 'uuid',
							default_value: null,
							foreign_key_column: null,
							foreign_key_table: null,
							generation_expression: null,
							has_auto_increment: false,
							is_generated: false,
							is_nullable: false,
							is_primary_key: true,
							is_unique: true,
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							table: 'test_table_2',
						},
						type: 'uuid',
					},
				],
			};

			// Stop call to db later on in apply-snapshot
			vi.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that createOne works, just that is is called correctly
			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');
			const createFieldSpy = vi.spyOn(FieldsService.prototype, 'createField').mockResolvedValue();

			await applySnapshot(snapshotCreateCollectionNotNested, {
				database: db,
				current: snapshotBeforeCreateCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(1);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected, mutationOptions);

			// There should be no fields left to create
			// they will get filtered in createCollections
			expect(createFieldSpy).toHaveBeenCalledTimes(0);
		});

		it('Creates the highest-level nested collection(s) with existing parents and any children', async () => {
			const expected = {
				collection: 'test_table_2',
				meta: {
					accountability: 'all',
					collection: 'test_table_2',
					group: 'test_table',
					hidden: true,
					icon: 'import_export',
					item_duplication_fields: null,
					note: null,
					singleton: false,
					translations: {},
					versioning: false,
				},
				schema: { name: 'test_table_2' },
				fields: [
					{
						collection: 'test_table_2',
						field: 'id',
						meta: {
							collection: 'test_table_2',
							conditions: null,
							display: null,
							display_options: null,
							field: 'id',
							group: null,
							hidden: true,
							interface: null,
							note: null,
							options: null,
							readonly: false,
							required: false,
							sort: null,
							special: null,
							translations: {},
							validation: null,
							validation_message: null,
							width: 'full',
						},
						schema: {
							data_type: 'uuid',
							default_value: null,
							foreign_key_column: null,
							foreign_key_table: null,
							generation_expression: null,
							has_auto_increment: false,
							is_generated: false,
							is_nullable: false,
							is_primary_key: true,
							is_unique: true,
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							table: 'test_table_2',
						},
						type: 'uuid',
					},
				],
			};

			const expected2 = {
				collection: 'test_table_3',
				fields: [
					{
						collection: 'test_table_3',
						field: 'id',
						meta: {
							collection: 'test_table_3',
							conditions: null,
							display: null,
							display_options: null,
							field: 'id',
							group: null,
							hidden: true,
							interface: null,
							note: null,
							options: null,
							readonly: false,
							required: false,
							sort: null,
							special: null,
							translations: {},
							validation: null,
							validation_message: null,
							width: 'full',
						},
						schema: {
							data_type: 'uuid',
							default_value: null,
							foreign_key_column: null,
							foreign_key_table: null,
							generation_expression: null,
							has_auto_increment: false,
							is_generated: false,
							is_nullable: false,
							is_primary_key: true,
							is_unique: true,
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							table: 'test_table_3',
						},
						type: 'uuid',
					},
				],
				meta: {
					accountability: 'all',
					collection: 'test_table_3',
					group: 'test_table_2',
					hidden: true,
					icon: 'import_export',
					item_duplication_fields: null,
					note: null,
					singleton: false,
					translations: {},
					versioning: false,
				},
				schema: { name: 'test_table_3' },
			};

			// Stop call to db later on in apply-snapshot
			vi.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that createOne works, just that is is called correctly
			const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');
			const createFieldSpy = vi.spyOn(FieldsService.prototype, 'createField').mockResolvedValue();

			await applySnapshot(snapshotCreateCollection, {
				database: db,
				current: snapshotBeforeCreateCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(2);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected, mutationOptions);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected2, mutationOptions);

			// There should be no fields left to create
			// they will get filtered in createCollections
			expect(createFieldSpy).toHaveBeenCalledTimes(0);
		});
	});

	describe('Creating new collection with UUID primary key field', () => {
		const fieldSchemaMaxLength = 36;

		it.each(['char', 'varchar'])(
			'casts non-postgres schema snapshots of UUID fields as %s(36) to UUID type',
			async (fieldSchemaDataType) => {
				const snapshotToApply: Snapshot = {
					version: 1,
					directus: '0.0.0',
					collections: [
						{
							collection: 'test_uuid_table',
							meta: {
								accountability: 'all',
								collection: 'test_uuid_table',
								group: null,
								hidden: true,
								icon: 'box',
								item_duplication_fields: null,
								note: null,
								singleton: false,
								translations: {},
							},
							schema: { name: 'test_uuid_table' },
						},
					],
					fields: [
						{
							collection: 'test_uuid_table',
							field: 'id',
							meta: {
								collection: 'test_uuid_table',
								conditions: null,
								display: null,
								display_options: null,
								field: 'id',
								group: null,
								hidden: true,
								interface: null,
								note: null,
								options: null,
								readonly: false,
								required: false,
								sort: null,
								special: null,
								translations: {},
								validation: null,
								validation_message: null,
								width: 'full',
							},
							schema: {
								comment: null,
								data_type: fieldSchemaDataType,
								default_value: null,
								foreign_key_column: null,
								foreign_key_schema: null,
								foreign_key_table: null,
								generation_expression: null,
								has_auto_increment: false,
								is_generated: false,
								is_nullable: false,
								is_primary_key: true,
								is_unique: true,
								max_length: fieldSchemaMaxLength,
								name: 'id',
								numeric_precision: null,
								numeric_scale: null,
								table: 'test_uuid_table',
							},
							type: 'uuid',
						} as SnapshotField,
					],
					relations: [],
				};

				const expected = {
					collection: 'test_uuid_table',
					meta: {
						accountability: 'all',
						collection: 'test_uuid_table',
						group: null,
						hidden: true,
						icon: 'box',
						item_duplication_fields: null,
						note: null,
						singleton: false,
						translations: {},
					},
					schema: { name: 'test_uuid_table' },
					fields: [
						{
							collection: 'test_uuid_table',
							field: 'id',
							meta: {
								collection: 'test_uuid_table',
								conditions: null,
								display: null,
								display_options: null,
								field: 'id',
								group: null,
								hidden: true,
								interface: null,
								note: null,
								options: null,
								readonly: false,
								required: false,
								sort: null,
								special: null,
								translations: {},
								validation: null,
								validation_message: null,
								width: 'full',
							},
							schema: {
								data_type: 'uuid',
								default_value: null,
								foreign_key_column: null,
								foreign_key_table: null,
								generation_expression: null,
								has_auto_increment: false,
								is_generated: false,
								is_nullable: false,
								is_primary_key: true,
								is_unique: true,
								max_length: null,
								name: 'id',
								numeric_precision: null,
								numeric_scale: null,
								table: 'test_uuid_table',
							},
							type: 'uuid',
						},
					],
				};

				// Stop call to db later on in apply-snapshot
				vi.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
				// We are not actually testing that createOne works, just that is is called with the right data type
				const createOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'createOne').mockResolvedValue('test');
				vi.spyOn(FieldsService.prototype, 'createField').mockResolvedValue();

				await applySnapshot(snapshotToApply, {
					database: db,
					current: {
						version: 1,
						directus: '0.0.0',
						collections: [],
						fields: [],
						relations: [],
					},
					schema: snapshotApplyTestSchema,
				});

				expect(createOneCollectionSpy).toHaveBeenCalledOnce();
				expect(createOneCollectionSpy).toHaveBeenCalledWith(expected, mutationOptions);
			}
		);
	});

	describe('Delete collections', () => {
		it('Deletes interrelated collections', async () => {
			const snapshotToApply: Snapshot = {
				version: 1,
				directus: '0.0.0',
				collections: [],
				fields: [],
				relations: [],
			};

			// Stop call to db later on in apply-snapshot
			vi.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that deleteOne works, just that is is called correctly
			const deleteOneCollectionSpy = vi.spyOn(CollectionsService.prototype, 'deleteOne').mockResolvedValue('test');

			await applySnapshot(snapshotToApply, {
				database: db,
				current: snapshotBeforeDeleteCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(deleteOneCollectionSpy).toHaveBeenCalledTimes(3);
		});
	});
});
