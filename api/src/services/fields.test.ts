import { Field } from '@directus/shared/types';
import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, MockedFunction, SpyInstance, vi } from 'vitest';
import { FieldsService } from '.';
import { InvalidPayloadException } from '../exceptions';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
	getSchemaInspector: vi.fn(),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(() => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Fields', () => {
		let service: FieldsService;

		beforeEach(() => {
			service = new FieldsService({
				schema: { collections: {}, relations: [] },
			});
		});

		afterEach(() => {
			vi.clearAllMocks();
		});

		describe('addColumnToTable', () => {
			let knexCreateTableBuilderSpy: SpyInstance;

			it.each(['alias', 'unknown'])('%s fields should be skipped', async (type) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';

				const promise = db.schema.alterTable(testCollection, (table) => {
					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				await expect(promise).resolves.not.toThrow();
			});

			it('illegal fields should be throw InvalidPayloadException', async () => {
				const testCollection = 'test_collection';
				const testField = 'test_field';
				const type = 'mystery';

				expect.assertions(2); // to ensure both assertions in the catch block are reached

				try {
					await db.schema.alterTable(testCollection, (table) => {
						service.addColumnToTable(table, {
							collection: testCollection,
							field: testField,
							type,
							schema: {
								name: testField,
								table: testCollection,
								data_type: type,
							},
							meta: {},
						} as any);
					});
				} catch (err: any) {
					expect(err.message).toBe(`Illegal type passed: "${type}"`);
					expect(err).toBeInstanceOf(InvalidPayloadException);
				}
			});

			it.each([
				{ type: 'integer', method: 'increments' },
				{ type: 'bigInteger', method: 'bigIncrements' },
			])('auto increment $type fields should use $method()', async ({ type, method }) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, method as keyof Knex.CreateTableBuilder);

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
							has_auto_increment: true,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField);
			});

			it.each([10, undefined])('string fields should use string() with %j max length', async (maxLength) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';
				const type = 'string';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, type as keyof Knex.CreateTableBuilder);

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
							max_length: maxLength,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField, maxLength);
			});

			it.each(['float', 'decimal'])(
				'precision and scale for %s fields should fallback to default value',
				async (type) => {
					const testCollection = 'test_collection';
					const testField = 'test_field';

					const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" ${type}.*`);
					tracker.on.any(regex).response({});

					await db.schema.alterTable(testCollection, (table) => {
						knexCreateTableBuilderSpy = vi.spyOn(table, type as keyof Knex.CreateTableBuilder);

						service.addColumnToTable(table, {
							collection: testCollection,
							field: testField,
							type,
							schema: {
								name: testField,
								table: testCollection,
								data_type: type,
							},
							meta: {},
						} as Field);
					});

					expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField, 10, 5);
				}
			);

			it.each(['float', 'decimal'])(
				'zero precision or scale for %s fields should not fallback to default value',
				async (type) => {
					const testCollection = 'test_collection';
					const testField = 'test_field';

					const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" ${type}.*`);
					tracker.on.any(regex).response({});

					await db.schema.alterTable('test_collection', (table) => {
						knexCreateTableBuilderSpy = vi.spyOn(table, type as keyof Knex.CreateTableBuilder);

						service.addColumnToTable(table, {
							collection: testCollection,
							field: testField,
							type,
							schema: {
								name: testField,
								table: testCollection,
								data_type: type,
								numeric_precision: 0,
								numeric_scale: 0,
							},
							meta: {},
						} as Field);
					});

					expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField, 0, 0);
				}
			);

			it('csv fields should use string()', async () => {
				const testCollection = 'test_collection';
				const testField = 'test_field';
				const type = 'csv';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, 'string');

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField);
			});

			it('hash fields should use string() with length 255', async () => {
				const testCollection = 'test_collection';
				const testField = 'test_field';
				const type = 'hash';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, 'string');

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField, 255);
			});

			it.each([
				{ type: 'dateTime', useTz: false },
				{ type: 'timestamp', useTz: true },
			])('$type fields should use $type() with { useTz: $useTz } option', async ({ type, useTz }) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, type as keyof Knex.CreateTableBuilder);

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField, { useTz });
			});

			it.each(['geometry', 'geometry.Point'])('%s fields should use this.helpers.st.createColumn()', async (type) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				const thisHelpersStCreateColumnSpy = vi.spyOn(service.helpers.st, 'createColumn');

				await db.schema.alterTable(testCollection, (table) => {
					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				expect(thisHelpersStCreateColumnSpy).toHaveBeenCalled();
			});

			// the rest of KNEX_TYPES except the ones above
			it.each([
				{ type: 'boolean' },
				{ type: 'date' },
				{ type: 'json' },
				{ type: 'text' },
				{ type: 'time' },
				{ type: 'binary' },
				{ type: 'uuid' },
			])('$type fields should use $type()', async ({ type }) => {
				const testCollection = 'test_collection';
				const testField = 'test_field';

				const regex = new RegExp(`alter table "${testCollection}" add column "${testField}" .*`);
				tracker.on.any(regex).response({});

				await db.schema.alterTable(testCollection, (table) => {
					knexCreateTableBuilderSpy = vi.spyOn(table, type as keyof Knex.CreateTableBuilder);

					service.addColumnToTable(table, {
						collection: testCollection,
						field: testField,
						type,
						schema: {
							name: testField,
							table: testCollection,
							data_type: type,
						},
						meta: {},
					} as Field);
				});

				expect(knexCreateTableBuilderSpy).toHaveBeenCalledWith(testField);
			});
		});
	});
});
