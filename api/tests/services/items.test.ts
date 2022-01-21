import knex, { Knex } from 'knex';
import { MockClient, Tracker, getTracker } from 'knex-mock-client';
import { ItemsService } from '../../src/services';
import { systemSchema, userSchema } from '../__test-utils__/schemas';

jest.mock('../../src/database/index', () => {
	return { getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});
jest.requireMock('../../src/database/index');
describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('System Table', () => {
		describe('createOne', () => {
			const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', email: 'test@gmail.com', password: 'TestPassword' };

			it('creates one item in collection directus_users as an admin, accountability: "null"', async () => {
				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: systemSchema,
				});

				tracker.on.insert('directus_users').responseOnce(item);

				const response = await itemsService.createOne(item, { emitEvents: false });

				expect(tracker.history.insert.length).toBe(1);
				expect(tracker.history.insert[0].bindings).toStrictEqual([item.id]);
				expect(tracker.history.insert[0].sql).toBe('insert into "directus_users" ("id") values (?)');

				expect(response).toBe(item.id);
			});
		});

		describe('readOne', () => {
			const rawItem = [{ id: 1 }];

			it('it returns one item from directus_users as admin', async () => {
				tracker.on.select('directus_users').responseOnce(rawItem);

				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: systemSchema,
				});
				expect(await itemsService.readOne('id')).toStrictEqual(rawItem[0]);
			});

			it('returns one item from directus_users not as admin but has permissions', async () => {
				tracker.on.select('directus_users').responseOnce(rawItem);

				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
						permissions: [
							{
								id: 1,
								role: 'admin',
								collection: 'directus_users',
								action: 'read',
								permissions: {},
								validation: {},
								presets: {},
								fields: [],
							},
						],
					},
					schema: systemSchema,
				});
				const response = await itemsService.readOne(1);

				// Test DB input with the sql submitted
				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([1, 100]);
				expect(tracker.history.select[0].sql).toBe(
					'select "directus_users"."id" from "directus_users" where ("directus_users"."id" = ?) order by "directus_users"."id" asc limit ?'
				);

				// Test that the returned item is processed correctly.
				expect(response).toStrictEqual(rawItem[0].id);
			});

			it('denies item from directus_users not as admin but collection accountability "all"', async () => {
				const schema = systemSchema;
				schema.collections.directus_users.accountability = 'all';

				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
					},
					schema: schema,
				});

				expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
				expect(tracker.history.select.length).toBe(0);
			});

			it('denies user access when permission action does not match read.', async () => {
				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
						permissions: [
							{
								id: 1,
								role: 'admin',
								collection: 'directus_users',
								action: 'create',
								permissions: {},
								validation: {},
								presets: {},
								fields: [],
							},
						],
					},
					schema: systemSchema,
				});
				expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
				expect(tracker.history.select.length).toBe(0);
			});
		});

		describe('readMany', () => {
			const items = [{ id: 1 }, { id: 2 }];

			it('it returns multiple items from directus_users as admin', async () => {
				tracker.on.select('directus_users').responseOnce(items);

				const itemsService = new ItemsService('directus_users', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: systemSchema,
				});
				const response = await itemsService.readMany([1, 2]);

				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
				expect(tracker.history.select[0].sql).toBe(
					'select "directus_users"."id" from "directus_users" where ("directus_users"."id" in (?, ?)) order by "directus_users"."id" asc limit ?'
				);

				expect(response).toStrictEqual(items);
			});
		});
	});

	describe('User Table', () => {
		describe('createOne', () => {
			const item = { id: '6107c897-9182-40f7-b22e-4f044d1258d2', email: 'test@gmail.com', password: 'TestPassword' };

			it('creates one item in collection authors as an admin, accountability: "null"', async () => {
				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: userSchema,
				});

				tracker.on.insert('authors').responseOnce(item);

				const response = await itemsService.createOne(item, { emitEvents: false });

				expect(tracker.history.insert.length).toBe(1);
				expect(tracker.history.insert[0].bindings).toStrictEqual([item.id]);
				expect(tracker.history.insert[0].sql).toBe('insert into "authors" ("id") values (?)');

				expect(response).toBe(item.id);
			});
		});

		describe('readOne', () => {
			const rawItem = [{ id: 1 }, { id: 2 }];

			it('it returns one item from authors as admin', async () => {
				tracker.on.select('authors').responseOnce(rawItem);

				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: userSchema,
				});
				expect(await itemsService.readOne(1)).toStrictEqual(rawItem[0]);
				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([rawItem[0].id, 100]);
				expect(tracker.history.select[0].sql).toBe(
					'select "authors"."id" from "authors" where "authors"."id" = ? order by "authors"."id" asc limit ?'
				);
			});

			it('returns one item from authors not as admin but has permissions', async () => {
				tracker.on.select('authors').responseOnce(rawItem);

				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
						permissions: [
							{
								id: 1,
								role: 'admin',
								collection: 'authors',
								action: 'read',
								permissions: {},
								validation: {},
								presets: {},
								fields: [],
							},
						],
					},
					schema: userSchema,
				});
				const response = await itemsService.readOne(1);

				// Test DB input with the sql submitted
				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([1, 100]);
				expect(tracker.history.select[0].sql).toBe(
					'select "authors"."id" from "authors" where ("authors"."id" = ?) order by "authors"."id" asc limit ?'
				);

				// Test that the returned item is processed correctly.
				expect(response).toStrictEqual(rawItem[0].id);
			});

			it('denies item from authors not as admin but collection accountability "all"', async () => {
				const schema = userSchema;
				schema.collections.authors.accountability = 'all';

				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
					},
					schema: schema,
				});

				expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
				expect(tracker.history.select.length).toBe(0);
			});

			it('denies user access when permission action does not match read.', async () => {
				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: {
						role: 'admin',
						admin: false,
						permissions: [
							{
								id: 1,
								role: 'admin',
								collection: 'authors',
								action: 'create',
								permissions: {},
								validation: {},
								presets: {},
								fields: [],
							},
						],
					},
					schema: userSchema,
				});
				expect(() => itemsService.readOne(1)).rejects.toThrow("You don't have permission to access this.");
				expect(tracker.history.select.length).toBe(0);
			});
		});

		describe('readMany', () => {
			const items = [{ id: 1 }, { id: 2 }];
			it('it returns multiple items from authors as admin', async () => {
				tracker.on.select('authors').responseOnce(items);
				const itemsService = new ItemsService('authors', {
					knex: db,
					accountability: { role: 'admin', admin: true },
					schema: userSchema,
				});
				const response = await itemsService.readMany([1, 2]);
				expect(tracker.history.select.length).toBe(1);
				expect(tracker.history.select[0].bindings).toStrictEqual([1, 2, 100]);
				expect(tracker.history.select[0].sql).toBe(
					'select "authors"."id" from "authors" where ("authors"."id" in (?, ?)) order by "authors"."id" asc limit ?'
				);
				expect(response).toStrictEqual(items);
			});
		});
	});
});
