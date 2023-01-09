import { NestedDeepQuery } from '@directus/shared/types';
import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { cloneDeep } from 'lodash';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, MockedFunction } from 'vitest';
import { ItemsService } from '../../src/services';
import { InvalidPayloadException } from '../exceptions';
import { sqlFieldFormatter, sqlFieldList } from '../__utils__/items-utils';
import { systemSchema, userSchema } from '../__utils__/schemas';
import { getDatabaseClient } from '../../src/database/index';

vi.mock('../env', async () => {
	const actual = (await vi.importActual('../env')) as { default: Record<string, any> };
	const MOCK_ENV = {
		...actual.default,
		CACHE_AUTO_PURGE: true,
	};
	return {
		default: MOCK_ENV,
		getEnv: () => MOCK_ENV,
	};
});

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn(),
}));

vi.mock('../cache', () => ({
	getCache: vi.fn().mockReturnValue({
		cache: {
			clear: vi.fn(),
		},
		systemCache: {
			clear: vi.fn(),
		},
	}),
}));

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	const schemas: Record<string, any> = {
		system: { schema: systemSchema, tables: Object.keys(systemSchema.collections) },
		user: { schema: userSchema, tables: Object.keys(userSchema.collections) },
	};

	beforeAll(() => {
		db = vi.mocked(knex({ client: MockClient }));
		tracker = getTracker();
	});

	beforeEach(() => {
		vi.mocked(getDatabaseClient).mockReturnValue('postgres');
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

		it(`the returned UUID primary key for MS SQL should be uppercase`, async () => {
			vi.mocked(getDatabaseClient).mockReturnValue('mssql');

			const table = schemas.system.tables[0];

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas.system.schema,
			});

			tracker.on.insert(table).responseOnce(item);

			const response = await itemsService.createOne(item, { emitEvents: false });

			expect(response).toBe(item.id.toUpperCase());
		});
	});

	describe('readOne', () => {
		const rawItems = [{ id: 'b5a7dd0f-fc9f-4242-b331-83990990198f' }, { id: '6107c897-9182-40f7-b22e-4f044d1258d2' }];

		describe('Permissions, Authorization, Roles', () => {
			it.each(Object.keys(schemas))('%s it returns one item from tables as admin', async (schema) => {
				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce(rawItems);
				// tracker.on.select(schemas[schema].tables[1]).responseOnce([]);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id, { fields: ['id', 'name'] });

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

			it.each(Object.keys(schemas))('%s returns one item with filter from tables as admin', async (schema) => {
				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce(rawItems);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id, {
					fields: ['id', 'name'],
					filter: { name: { _eq: 'something' } },
				});

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual(['something', rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select "${table}"."id", "${table}"."name" from "${table}" where "${table}"."name" = ? and "${table}"."id" = ? order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual({ id: rawItems[0].id });
			});

			it.each(Object.keys(schemas))(
				'%s returns one item with filter from tables not as admin but has field permissions',
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
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: table,
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id', 'name'],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id, {
						fields: ['id', 'name'],
						filter: { name: { _eq: 'something' } },
					});

					expect(tracker.history.select.length).toBe(1);
					expect(tracker.history.select[0].bindings).toStrictEqual(['something', rawItems[0].id, 100]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${table}"."id", "${table}"."name" from "${table}" where ("${table}"."name" = ? and "${table}"."id" = ?) order by "${table}"."id" asc limit ?`
					);

					expect(response).toStrictEqual({ id: rawItems[0].id });
				}
			);

			it.each(Object.keys(schemas))(
				'%s returns one item with filter on relational field from tables not as admin and has top level field permissions only',
				async (schema) => {
					const table = schemas[schema].tables[1];

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
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: table,
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id, {
						fields: ['id'],
						filter: { uploaded_by: { _in: ['b5a7dd0f-fc9f-4242-b331-83990990198f'] } },
					});

					expect(tracker.history.select.length).toBe(1);
					expect(tracker.history.select[0].bindings).toStrictEqual([
						'b5a7dd0f-fc9f-4242-b331-83990990198f',
						rawItems[0].id,
						100,
					]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${table}"."id" from "${table}" where ("${table}"."uploaded_by" in (?) and "${table}"."id" = ?) order by "${table}"."id" asc limit ?`
					);

					expect(response).toStrictEqual({ id: rawItems[0].id });
				}
			);

			it.each(Object.keys(schemas))(
				'%s returns one item with filter on relational field from tables not as admin and has relational permissions',
				async (schema) => {
					const table = schemas[schema].tables[1];

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
									collection: schemas[schema].tables[0],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 3,
									role: 'admin',
									collection: schemas[schema].tables[0],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 4,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id, {
						fields: ['id'],
						filter: { uploaded_by: { _in: ['b5a7dd0f-fc9f-4242-b331-83990990198f'] } },
					});

					expect(tracker.history.select.length).toBe(1);
					expect(tracker.history.select[0].bindings).toStrictEqual([
						'b5a7dd0f-fc9f-4242-b331-83990990198f',
						rawItems[0].id,
						100,
					]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${table}"."id" from "${table}" where ("${table}"."uploaded_by" in (?) and "${table}"."id" = ?) order by "${table}"."id" asc limit ?`
					);

					expect(response).toStrictEqual({ id: rawItems[0].id });
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies one item with filter from tables not as admin and has no field permissions',
				async (schema) => {
					let table = schemas[schema].tables[1];
					const item = {
						id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7',
						uploaded_by: '6107c897-9182-40f7-b22e-4f044d1258d2',
					};
					let itemsService = new ItemsService(table, {
						knex: db,
						accountability: { role: 'admin', admin: true },
						schema: schemas[schema].schema,
					});

					tracker.on.insert(table).responseOnce(item);

					await itemsService.createOne(item, { emitEvents: false });

					table = schemas[schema].tables[0];

					tracker.on.select(table).responseOnce(rawItems);

					itemsService = new ItemsService(table, {
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
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: table,
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id'],
								},
							],
						},
						schema: schemas[schema].schema,
					});

					expect(() =>
						itemsService.readOne(rawItems[0].id, { filter: { name: { _eq: 'something' } } })
					).rejects.toThrow("You don't have permission to access this.");
					expect(tracker.history.select.length).toBe(0);
				}
			);

			it.each(Object.keys(schemas))('%s returns one item with deep filter from tables as admin', async (schema) => {
				const childTable = schemas[schema].tables[1];

				const childItems = [
					{
						id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7',
						title: 'A new child item',
						uploaded_by: 'b5a7dd0f-fc9f-4242-b331-83990990198f',
					},
				];

				tracker.on.select(childTable).response(childItems);

				const table = schemas[schema].tables[0];

				tracker.on.select(table).responseOnce(rawItems);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id, {
					fields: ['id', 'items.*'],
					deep: { items: { _filter: { title: { _eq: childItems[0].title } } } as NestedDeepQuery },
				});

				expect(tracker.history.select.length).toBe(2);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select "${table}"."id" from "${table}" where "${table}"."id" = ? order by "${table}"."id" asc limit ?`
				);
				expect(tracker.history.select[1].bindings).toStrictEqual([
					childItems[0].title,
					...rawItems.map((item) => item.id),
					25000,
				]);
				expect(tracker.history.select[1].sql).toBe(
					`select "${childTable}"."id", "${childTable}"."title", "${childTable}"."uploaded_by" from "${childTable}" where "${childTable}"."title" = ? and "${childTable}"."uploaded_by" in (?, ?) order by "${childTable}"."id" asc limit ?`
				);
				expect(response).toStrictEqual({ id: rawItems[0].id, items: childItems });
			});

			it.each(Object.keys(schemas))(
				'%s returns one item with deep filter from tables not as admin but has field permissions',
				async (schema) => {
					const childTable = schemas[schema].tables[1];

					const childItems = [
						{
							id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7',
							title: 'A new child item',
							uploaded_by: 'b5a7dd0f-fc9f-4242-b331-83990990198f',
						},
					];

					tracker.on.select(childTable).response(childItems);

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
									collection: schemas[schema].tables[0],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 3,
									role: 'admin',
									collection: schemas[schema].tables[0],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id', 'items'],
								},
								{
									id: 4,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id', 'title', 'uploaded_by'],
								},
							],
						},
						schema: schemas[schema].schema,
					});
					const response = await itemsService.readOne(rawItems[0].id, {
						fields: ['id', 'items.*'],
						deep: { items: { _filter: { title: { _eq: childItems[0].title } } } as NestedDeepQuery },
					});

					expect(tracker.history.select.length).toBe(2);
					expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
					expect(tracker.history.select[0].sql).toBe(
						`select "${table}"."id" from "${table}" where ("${table}"."id" = ?) order by "${table}"."id" asc limit ?`
					);
					expect(tracker.history.select[1].bindings).toStrictEqual([
						childItems[0].title,
						...rawItems.map((item) => item.id),
						25000,
					]);
					expect(tracker.history.select[1].sql).toBe(
						`select "${childTable}"."id", "${childTable}"."title", "${childTable}"."uploaded_by" from "${childTable}" where ("${childTable}"."title" = ?) and "${childTable}"."uploaded_by" in (?, ?) order by "${childTable}"."id" asc limit ?`
					);
					expect(response).toStrictEqual({ id: rawItems[0].id, items: childItems });
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies one item with deep filter from tables not as admin and has no field permissions',
				async (schema) => {
					const childTable = schemas[schema].tables[1];

					const childItems = [
						{
							id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7',
							title: 'A new child item',
							uploaded_by: 1,
						},
					];

					tracker.on.select(childTable).response(childItems);

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
									collection: schemas[schema].tables[0],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 2,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'create',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['*'],
								},
								{
									id: 3,
									role: 'admin',
									collection: schemas[schema].tables[0],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id', 'items'],
								},
								{
									id: 4,
									role: 'admin',
									collection: schemas[schema].tables[1],
									action: 'read',
									permissions: {},
									validation: {},
									presets: {},
									fields: ['id', 'uploaded_by'],
								},
							],
						},
						schema: schemas[schema].schema,
					});

					expect(() =>
						itemsService.readOne(rawItems[0].id, {
							fields: ['id', 'items.*'],
							deep: { items: { _filter: { title: { _eq: childItems[0].title } } } as NestedDeepQuery },
						})
					).rejects.toThrow("You don't have permission to access this.");
					expect(tracker.history.select.length).toBe(0);
				}
			);

			it.each(Object.keys(schemas))(
				'%s denies item from tables not as admin but collection accountability "all"',
				async (schema) => {
					const table = schemas[schema].tables[0];

					const customSchema = cloneDeep(schemas[schema].schema);
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

			it.each(Object.keys(schemas))('%s returns count() that is processed without role permissions', async (schema) => {
				const childTable = schemas[schema].tables[1];

				const childItems = [
					{
						items_count: 1,
						id: rawItems[0].id,
					},
				];

				tracker.on.select(childTable).response(childItems);

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
								collection: schemas[schema].tables[0],
								action: 'read',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['id', 'items'],
							},
							{
								id: 2,
								role: 'admin',
								collection: schemas[schema].tables[1],
								action: 'read',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['id', 'title', 'uploaded_by'],
							},
						],
					},
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id, {
					fields: ['count(items)'],
				});

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select (select count(*) from "${childTable}" where "uploaded_by" = "${table}"."id") AS "items_count", "${table}"."id" from "${table}" where ("${table}"."id" = ?) order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual({ items_count: 1 });
			});

			it.each(Object.keys(schemas))('%s returns count() that is processed with role permissions', async (schema) => {
				const childTable = schemas[schema].tables[1];

				const childItems = [
					{
						items_count: 1,
						id: rawItems[0].id,
					},
				];

				tracker.on.select(childTable).response(childItems);

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
								collection: schemas[schema].tables[0],
								action: 'read',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['id', 'items'],
							},
							{
								id: 2,
								role: 'admin',
								collection: schemas[schema].tables[1],
								action: 'read',
								permissions: { _and: [{ title: { _contains: 'child' } }] },
								validation: {},
								presets: {},
								fields: ['id', 'title', 'uploaded_by'],
							},
						],
					},
					schema: schemas[schema].schema,
				});
				const response = await itemsService.readOne(rawItems[0].id, {
					fields: ['count(items)'],
				});

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItems[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					`select (select count(*) from "${childTable}" where "uploaded_by" = "${table}"."id" and (("${childTable}"."title" like '%child%'))) AS "items_count", "${table}"."id" from "${table}" where ("${table}"."id" = ?) order by "${table}"."id" asc limit ?`
				);

				expect(response).toStrictEqual({ items_count: 1 });
			});
		});
	});

	describe('readMany', () => {
		const items = [
			{ id: 'b5a7dd0f-fc9f-4242-b331-83990990198f', name: 'string1' },
			{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', name: 'string2' },
		];

		it.each(Object.keys(schemas))('%s it returns multiple items from tables as admin', async (schema) => {
			const table = schemas[schema].tables[0];

			tracker.on.select(table).responseOnce(items);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			const response = await itemsService.readMany([items[0].id, items[1].id], { fields: ['id', 'name'] });

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([items[0].id, items[1].id, 2]);
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
				const response = await itemsService.readMany([], {
					fields: ['id', 'name'],
					filter: { id: { _eq: items[1].id } },
				});

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
					fields: ['id', 'name'],
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

	describe('updateOne', () => {
		const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', name: 'Item name', items: [] };

		it.each(Object.keys(schemas))(
			'%s updates relational field in one item without read permissions',
			async (schema) => {
				const childTable = schemas[schema].tables[1];

				const childItem = {
					id: 'd66ec139-2655-48c1-9d9a-4753f98a9ee7',
					title: 'A new child item',
					uploaded_by: '6107c897-9182-40f7-b22e-4f044d1258d2',
				};
				tracker.on.select(childTable).response([childItem]);
				tracker.on.update(childTable).response(childItem);

				const table = schemas[schema].tables[0];
				schemas[schema].accountability = null;

				tracker.on.select(table).response([item]);

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
						permissions: [
							{
								id: 1,
								role: 'admin',
								collection: schemas[schema].tables[0],
								action: 'create',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['*'],
							},
							{
								id: 2,
								role: 'admin',
								collection: schemas[schema].tables[1],
								action: 'create',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['*'],
							},
							{
								id: 3,
								role: 'admin',
								collection: schemas[schema].tables[0],
								action: 'update',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['*'],
							},
							{
								id: 4,
								role: 'admin',
								collection: schemas[schema].tables[1],
								action: 'update',
								permissions: {},
								validation: {},
								presets: {},
								fields: ['*'],
							},
						],
					},
					schema: schemas[schema].schema,
				});
				const response = await itemsService.updateOne(
					item.id,
					{
						items: [],
					},
					{ emitEvents: false }
				);

				expect(tracker.history.select.length).toBe(4);
				expect(tracker.history.select[0].bindings).toStrictEqual([item.id, 1]);
				expect(tracker.history.select[0].sql).toBe(
					`select "${table}"."id", "${table}"."name" from "${table}" where (("${table}"."id" in (?))) order by "${table}"."id" asc limit ?`
				);
				expect(tracker.history.select[1].bindings).toStrictEqual([item.id, 25000]);
				expect(tracker.history.select[1].sql).toBe(
					`select "${childTable}"."uploaded_by", "${childTable}"."id" from "${childTable}" where "${childTable}"."uploaded_by" in (?) order by "${childTable}"."id" asc limit ?`
				);
				expect(tracker.history.select[2].bindings).toStrictEqual([item.id, 1, 100]);
				expect(tracker.history.select[2].sql).toBe(
					`select "${childTable}"."id" from "${childTable}" where ("${childTable}"."uploaded_by" = ? and 1 = ?) order by "${childTable}"."id" asc limit ?`
				);
				expect(tracker.history.select[3].bindings).toStrictEqual([childItem.id, 1]);
				expect(tracker.history.select[3].sql).toBe(
					`select "${childTable}"."id", "${childTable}"."title", "${childTable}"."uploaded_by" from "${childTable}" where (("${childTable}"."id" in (?))) order by "${childTable}"."id" asc limit ?`
				);
				expect(tracker.history.update[0].bindings).toStrictEqual([null, childItem.id]);
				expect(tracker.history.update[0].sql).toBe(`update "${childTable}" set "uploaded_by" = ? where "id" in (?)`);

				expect(response).toStrictEqual(item.id);
			}
		);
	});

	describe('updateBatch', () => {
		const items = [
			{ id: '6107c897-9182-40f7-b22e-4f044d1258d2', name: 'Item 1' },
			{ id: '6e7d4a2c-e62f-43b4-a343-9196f4b1783f', name: 'Item 2' },
		];

		it.each(Object.keys(schemas))('%s batch update should only clear cache once', async (schema) => {
			const table = schemas[schema].tables[0];
			schemas[schema].accountability = null;

			tracker.on.select(table).response(items);
			tracker.on.update(table).response(items);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: {
					role: 'admin',
					admin: true,
				},
				schema: schemas[schema].schema,
			});

			const itemsServiceCacheClearSpy = vi.spyOn(itemsService.cache, 'clear' as never).mockResolvedValue(() => vi.fn());

			await itemsService.updateBatch(items);

			expect(itemsServiceCacheClearSpy).toHaveBeenCalledOnce();
		});

		it.each(Object.keys(schemas))(
			'%s batch update should throw InvalidPayloadException when passing non-array data',
			async (schema) => {
				const table = schemas[schema].tables[0];
				schemas[schema].accountability = null;

				tracker.on.select(table).response({});
				tracker.on.update(table).response({});

				const itemsService = new ItemsService(table, {
					knex: db,
					accountability: {
						role: 'admin',
						admin: true,
					},
					schema: schemas[schema].schema,
				});

				expect.assertions(2);

				try {
					// intentional `as any` to test non-array data on runtime
					await itemsService.updateBatch(items[0] as any);
				} catch (err) {
					expect((err as Error).message).toBe(`Input should be an array of items.`);
					expect(err).toBeInstanceOf(InvalidPayloadException);
				}
			}
		);
	});

	describe('test filter queries', () => {
		const rawItems = [{ id: 'b5a7dd0f-fc9f-4242-b331-83990990198f' }, { id: '6107c897-9182-40f7-b22e-4f044d1258d2' }];

		it.each(Object.keys(schemas))('%s filters on top level', async (schema) => {
			const table = schemas[schema].tables[0];

			tracker.on.select(table).responseOnce(rawItems);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'name'],
				filter: { name: { _eq: 'something' } },
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual(['something', 100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${table}"."id", "${table}"."name" from "${table}" where "${table}"."name" = ? order by "${table}"."id" asc limit ?`
			);
		});

		it.each(Object.keys(schemas))('%s filters on nested m2o level', async (schema) => {
			const table = schemas[schema].tables[0];
			const otherTable = schemas[schema].tables[1];

			tracker.on.select(otherTable).responseOnce(rawItems);

			const itemsService = new ItemsService(otherTable, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'title'],
				filter: { uploaded_by: { name: { _eq: 'something' } } },
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual(['something', 100]);
			expect(tracker.history.select[0].sql).toMatch(
				new RegExp(
					`select "${otherTable}"."id", "${otherTable}"."title" from "${otherTable}" ` +
						`left join "${table}" as ".{5}" on "${otherTable}"."uploaded_by" = ".{5}"."id" ` +
						`where ".{5}"."name" = \\? order by "${otherTable}"."id" asc limit \\?`
				)
			);
		});

		it.each(Object.keys(schemas))('%s filters on nested o2m level', async (schema) => {
			const table = schemas[schema].tables[0];
			const otherTable = schemas[schema].tables[1];

			tracker.on.select(table).responseOnce(rawItems);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'name'],
				filter: { items: { title: { _eq: 'something' } } },
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual(['something', 100]);
			expect(tracker.history.select[0].sql).toMatch(
				new RegExp(
					`select "${table}"."id", "${table}"."name" from "${table}" inner join ` +
						`\\(select distinct "${table}"."id", "${table}"."id" as "sort_.{5}" from "${table}" left join "${otherTable}" as ".{5}" ` +
						`on "${table}"."id" = ".{5}"."uploaded_by" where ".{5}"."title" = \\? order by "${table}"."id" asc limit \\?\\) as "inner" ` +
						`on "${table}"."id" = "inner"."id" order by "inner"."sort_.{5}" asc`
				)
			);
		});
	});

	describe('test sort queries', () => {
		const rawItems = [{ id: 'b5a7dd0f-fc9f-4242-b331-83990990198f' }, { id: '6107c897-9182-40f7-b22e-4f044d1258d2' }];

		it.each(Object.keys(schemas))('%s sorts on top level', async (schema) => {
			const table = schemas[schema].tables[0];

			tracker.on.select(table).responseOnce(rawItems);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'name'],
				sort: ['name'],
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([100]);
			expect(tracker.history.select[0].sql).toBe(
				`select "${table}"."id", "${table}"."name" from "${table}" order by "${table}"."name" asc limit ?`
			);
		});

		it.each(Object.keys(schemas))('%s sorts on nested m2o level', async (schema) => {
			const table = schemas[schema].tables[0];
			const otherTable = schemas[schema].tables[1];

			tracker.on.select(otherTable).responseOnce(rawItems);

			const itemsService = new ItemsService(otherTable, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'title'],
				sort: ['uploaded_by.name'],
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([100]);
			expect(tracker.history.select[0].sql).toMatch(
				new RegExp(
					`select "${otherTable}"."id", "${otherTable}"."title" from "${otherTable}" ` +
						`left join "${table}" as ".{5}" on "${otherTable}"."uploaded_by" = ".{5}"."id" order by ".{5}"."name" asc limit \\?`
				)
			);
		});

		it.each(Object.keys(schemas))('%s sorts on nested o2m level', async (schema) => {
			const table = schemas[schema].tables[0];
			const otherTable = schemas[schema].tables[1];

			tracker.on.select(table).responseOnce(rawItems);

			const itemsService = new ItemsService(table, {
				knex: db,
				accountability: { role: 'admin', admin: true },
				schema: schemas[schema].schema,
			});
			await itemsService.readByQuery({
				fields: ['id', 'name'],
				sort: ['items.title'],
			});

			expect(tracker.history.select.length).toBe(1);
			expect(tracker.history.select[0].bindings).toStrictEqual([100, 1, 100]);
			expect(tracker.history.select[0].sql).toMatch(
				new RegExp(
					`select "${table}"."id", "${table}"."name" from "${table}" ` +
						`inner join \\(select distinct "${table}"."id", ".{5}"."title" as "sort_.{5}", ` +
						`row_number\\(\\) over \\(partition by "${table}"."id" order by ".{5}"."title" asc\\) as "directus_row_number" from "${table}" ` +
						`left join "${otherTable}" as ".{5}" on "${table}"."id" = ".{5}"."uploaded_by" order by ".{5}"."title" asc limit \\?\\)` +
						` as "inner" on "${table}"."id" = "inner"."id" ` +
						`where "inner"."directus_row_number" = \\? order by "inner"."sort_.{5}" asc limit \\?`
				)
			);
		});
	});
});
