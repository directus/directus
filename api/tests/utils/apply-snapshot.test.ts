import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { snapshotApplyTestSchema } from '../__test-utils__/schemas';

import { CollectionsService, FieldsService } from '../../src/services';
import { applySnapshot } from '../../src/utils/apply-snapshot';
import * as getSchema from '../../src/utils/get-schema';
import {
	snapshotBeforeCreateCollection,
	snapshotCreateCollection,
	snapshotCreateCollectionNotNested,
	snapshotBeforeDeleteCollection,
} from '../__test-utils__/snapshots';
import { Snapshot } from '../../src/types';

jest.mock('../../src/database/index', () => {
	return {
		getDatabaseClient: jest.fn().mockReturnValue('postgres'),
	};
});
jest.requireMock('../../src/database/index');

class Client_PG extends MockClient {}

describe('applySnapshot', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeEach(() => {
		db = knex({ client: Client_PG }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
		jest.clearAllMocks();
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
				},
				schema: { comment: null, name: 'test_table_2', schema: 'public' },
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
							comment: null,
							data_type: 'uuid',
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
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							schema: 'public',
							table: 'test_table_2',
						},
						type: 'uuid',
					},
				],
			};

			// Stop call to db later on in apply-snapshot
			jest.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that createOne works, just that is is called correctly
			const createOneCollectionSpy = jest
				.spyOn(CollectionsService.prototype, 'createOne')
				.mockImplementation(jest.fn());
			const createFieldSpy = jest.spyOn(FieldsService.prototype, 'createField').mockImplementation(jest.fn());

			await applySnapshot(snapshotCreateCollectionNotNested, {
				database: db,
				current: snapshotBeforeCreateCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(1);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected);

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
				},
				schema: { comment: null, name: 'test_table_2', schema: 'public' },
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
							comment: null,
							data_type: 'uuid',
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
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							schema: 'public',
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
							comment: null,
							data_type: 'uuid',
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
							max_length: null,
							name: 'id',
							numeric_precision: null,
							numeric_scale: null,
							schema: 'public',
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
				},
				schema: { comment: null, name: 'test_table_3', schema: 'public' },
			};

			// Stop call to db later on in apply-snapshot
			jest.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that createOne works, just that is is called correctly
			const createOneCollectionSpy = jest
				.spyOn(CollectionsService.prototype, 'createOne')
				.mockImplementation(jest.fn());
			const createFieldSpy = jest.spyOn(FieldsService.prototype, 'createField').mockImplementation(jest.fn());

			await applySnapshot(snapshotCreateCollection, {
				database: db,
				current: snapshotBeforeCreateCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(createOneCollectionSpy).toHaveBeenCalledTimes(2);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected);
			expect(createOneCollectionSpy).toHaveBeenCalledWith(expected2);

			// There should be no fields left to create
			// they will get filtered in createCollections
			expect(createFieldSpy).toHaveBeenCalledTimes(0);
		});
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
			jest.spyOn(getSchema, 'getSchema').mockReturnValue(Promise.resolve(snapshotApplyTestSchema));
			// We are not actually testing that deleteOne works, just that is is called correctly
			const deleteOneCollectionSpy = jest
				.spyOn(CollectionsService.prototype, 'deleteOne')
				.mockImplementation(jest.fn());

			await applySnapshot(snapshotToApply, {
				database: db,
				current: snapshotBeforeDeleteCollection,
				schema: snapshotApplyTestSchema,
			});

			expect(deleteOneCollectionSpy).toHaveBeenCalledTimes(3);
		});
	});
});
