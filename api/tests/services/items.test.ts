import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../src/services';
import { sqlFieldFormatter, sqlFieldList } from '../__test-utils__/items-utils';
import { systemSchema, userSchema } from '../__test-utils__/schemas';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	const schemas: Record<string, any> = {
		system: { schema: systemSchema, tables: Object.keys(systemSchema.collections) },
		user: { schema: userSchema, tables: Object.keys(userSchema.collections) },
	};

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('createOne', () => {
		const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', name: 'A.G.' };

		it.each(Object.keys(schemas))(
			`%s creates one item in collection as an admin, accountability: "null"`,
			async (schema) => {
				const table = schemas[schema].tables[0];

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});

				tracker.on.insert(table).responseOnce(item);

				const response = await itemsService.createOne(item, { emitEvents: false });

				expect(tracker.history.insert.length).toBe(1);
				expect(tracker.history.insert[0].bindings).toStrictEqual([item.id, item.name]);
				expect(tracker.history.insert[0].sql).toBe(
					`insert into "${table}" (${sqlFieldList(schemas[schema].schema, table)}) values (?, ?)`
				);

				expect(response).toBe(item.id);
			}
		);
	});

	describe('readOne', () => {
		const rawItems = [{ id: 1 }, { id: 2 }];

		describe('Permissions, Authorization, Roles', () => {
			it.each(Object.keys(schemas))('%s it returns one item from tables as admin', async (schema) => {
				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce(rawItems);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id);

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select ${sqlFieldFormatter(
						schemas[schema].schema,
						table
					)} from "${table}" where "${table}"."id" = ? order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual(rawItems[0]);
			});

			it.each(Object.keys(schemas))(
				'%s returns one item from tables not as admin but has permissions',
				async (schema) => {
					const table = schemas[schema].tables[0];

					tracker.on.select(table).responseOnce(rawItems);

					const itemsService = new ItemsService(table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
							permissions: [
								{
									id: 1,
									role: 'admin',
									collection: table,
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: [],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id);

					expect(tracker.history.select.length).toBe(1);
					expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${table}"."id" from "${table}" where ("${table}"."id" = ?) order by "${table}"."id" asc limit ?`
					);

					expect(response).toStrictEqual(rawItems[0].id);
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies item from tables not as admin but collection accountability "all"',
				async (schema) => {
					const table = schemas[schema].tables[0];

					const customSchema = schemas[schema].schema;
					customSchema.collections[table].accountability = 'all';

					const itemsService = new ItemsService(table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
						},
						schema: customSchema,
					});

					expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow(
						"You don't have permission to access this."
					);
					expect(tracker.history.select.length).toBe(0);
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies user access when permission action does not match read.',
				async (schema) => {
					const table = schemas[schema].tables[0];

					const itemsService = new ItemsService(table, {
						knex: db,
						accountability: {
							role: 'admin',
							admin: false,
							permissions: [
								{
									id: 1,
									role: 'admin',
									collection: table,
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: [],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					expect(() => itemsService.readOne(rawItems[0].id)).rejects.toThrow(
						"You don't have permission to access this."
					);
					expect(tracker.history.select.length).toBe(0);
				}
			);
		});
	});

	describe('readMany', () => {
		const items = [
			{ id: 1, name: 'string1' },
			{ id: 2, name: 'string2' },
		];

		it.each(Object.keys(schemas))('%s it returns multiple items from tables as admin', async (schema) => {
			const table = schemas[schema].tables[0];

			tracker.on.select(table).responseOnce(items);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			const response = await itemsService.readMany([1, 2]);

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select ${sqlFieldFormatter(
					schemas[schema].schema,
					table
				)} from "${table}" where ("${table}"."id" in (?, ?)) order by "${table}"."id" asc limit ?`
			);

			expect(response).toStrictEqual(items);
		});

		describe('Global Query Params', () => {
			it.each(Object.keys(schemas))(`Filter: %s _eq`, async (schema) => {
				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce([items[1]]);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readMany([], { filter: { id: { _eq: items[1].id } } });

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([0, items[1].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select ${sqlFieldFormatter(
						schemas[schema].schema,
						table
					)} from "${table}" where (1 = ? and "${table}"."id" = ?) order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual([items[1]]);
			});

			it.each(Object.keys(schemas))(`Filter: %s _or`, async (schema) => {
				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce([items[1]]);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readMany([], {
					filter: { _or: [{ id: { _eq: items[1].id } }, { name: { _eq: items[1].name } }] },
				});

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([0, items[1].id, items[1].name, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select ${sqlFieldFormatter(
						schemas[schema].schema,
						table
					)} from "${table}" where (1 = ? and ("${table}"."id" = ? or "${table}"."name" = ?)) order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual([items[1]]);
			});
		});
	});
});
