import { VERSION_KEY_PUBLISHED, VERSION_KEY_PUBLISHED_LEGACY } from '@directus/constants';
import { CollectionInactiveError } from '@directus/errors';
import { SchemaBuilder } from '@directus/schema-builder';
import { type Accountability, UserIntegrityCheckFlag } from '@directus/types';
import knex, { type Knex } from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, type MockedFunction, test, vi } from 'vitest';
import { SchemaHelperMSSQL } from '../database/helpers/schema/dialects/mssql.js';
import { getDatabaseClient } from '../database/index.js';
import { validateCollectionActive } from '../permissions/modules/validate-collection-active/validate-collection-active.js';
import { validateUserCountIntegrity } from '../utils/validate-user-count-integrity.js';
import { handleVersion } from '../utils/versioning/handle-version.js';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
	getDatabaseClient: vi.fn().mockReturnValue('postgres'),
}));

vi.mock('../permissions/modules/validate-collection-active/validate-collection-active.js');
vi.mock('../utils/validate-user-count-integrity.js');
vi.mock('../utils/versioning/handle-version.js', { spy: true });

const schema = new SchemaBuilder()
	.collection('test', (c) => {
		c.field('id').id();
		c.field('status').string();
		c.field('sort').integer().sort();
		c.field('name').string();
	})
	.collection('directus_versions', (c) => {
		c.field('id').id();
		c.field('item').string();
		c.field('collection').string();
		c.field('key').string();
	})
	.build();

describe('Integration Tests', () => {
	let db: MockedFunction<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = vi.mocked(knex.default({ client: MockClient }));
		tracker = createTracker(db);
	});

	beforeEach(() => {
		tracker.on.any('test').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Items', () => {
		let service: ItemsService;

		beforeEach(() => {
			service = new ItemsService('test', {
				knex: db,
				schema,
			});
		});

		afterEach(() => {
			vi.clearAllMocks();
		});

		describe('read with version "test"', () => {
			test('on readOne', async () => {
				vi.mocked(handleVersion).mockReturnValueOnce(new Promise((resolve) => resolve([{ id: 1 }])));

				await service.readOne(1, { version: 'test' });

				expect(handleVersion).toHaveBeenCalled();
			});

			test('on readSingleton', async () => {
				vi.mocked(handleVersion).mockReturnValueOnce(new Promise((resolve) => resolve([{ id: 1 }])));

				vi.spyOn(db, 'select').mockReturnValueOnce({
					from: () => ({
						first: async () => ({ id: 1 }),
					}),
				} as any);

				await service.readSingleton({ version: 'test' });

				expect(handleVersion).toHaveBeenCalled();
			});
		});

		describe('read with published version key', () => {
			test('on readOne with current key', async () => {
				service.readByQuery = vi.fn(async () => [{ id: 1 }]);

				await service.readOne(1, { version: VERSION_KEY_PUBLISHED });

				expect(handleVersion).not.toHaveBeenCalled();
			});

			test('on readSingleton with current key', async () => {
				service.readByQuery = vi.fn(async () => [{ id: 1 }]);

				await service.readSingleton({ version: VERSION_KEY_PUBLISHED });

				expect(handleVersion).not.toHaveBeenCalled();
			});

			test('on readOne with legacy key (backwards compat)', async () => {
				service.readByQuery = vi.fn(async () => [{ id: 1 }]);

				await service.readOne(1, { version: VERSION_KEY_PUBLISHED_LEGACY });

				expect(handleVersion).not.toHaveBeenCalled();
			});

			test('on readSingleton with legacy key (backwards compat)', async () => {
				service.readByQuery = vi.fn(async () => [{ id: 1 }]);

				await service.readSingleton({ version: VERSION_KEY_PUBLISHED_LEGACY });

				expect(handleVersion).not.toHaveBeenCalled();
			});
		});

		describe('createOne', () => {
			it('should validate user count if requested', async () => {
				await service.createOne({}, { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

				expect(validateUserCountIntegrity).toHaveBeenCalled();
			});

			it('should use includeTriggerModifications for MS SQL tables that have triggers', async () => {
				vi.mocked(getDatabaseClient).mockReturnValue('mssql');
				const hasTriggersSpy = vi.spyOn(SchemaHelperMSSQL.prototype, 'hasTriggers').mockResolvedValue(true);

				const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);

				const mockQuery = {
					insert: vi.fn().mockReturnThis(),
					into: vi.fn().mockReturnThis(),
					returning: mockReturning,
				};

				const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
					const trx = { ...db, ...mockQuery };
					return await callback(trx as any);
				});

				await service.createOne({ name: 'Test' });

				expect(mockReturning).toHaveBeenCalledWith('id', { includeTriggerModifications: true });

				transactionSpy.mockRestore();
				hasTriggersSpy.mockRestore();
			});

			it('should not use includeTriggerModifications for MS SQL tables without triggers', async () => {
				vi.mocked(getDatabaseClient).mockReturnValue('mssql');
				const hasTriggersSpy = vi.spyOn(SchemaHelperMSSQL.prototype, 'hasTriggers').mockResolvedValue(false);

				const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);

				const mockQuery = {
					insert: vi.fn().mockReturnThis(),
					into: vi.fn().mockReturnThis(),
					returning: mockReturning,
				};

				const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
					const trx = { ...db, ...mockQuery };
					return await callback(trx as any);
				});

				await service.createOne({ name: 'Test' });

				expect(mockReturning).toHaveBeenCalledWith('id', undefined);

				transactionSpy.mockRestore();
				hasTriggersSpy.mockRestore();
			});

			it('should not use includeTriggerModifications for non-MS SQL', async () => {
				vi.mocked(getDatabaseClient).mockReturnValue('postgres');

				const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);

				const mockQuery = {
					insert: vi.fn().mockReturnThis(),
					into: vi.fn().mockReturnThis(),
					returning: mockReturning,
				};

				const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (callback) => {
					const trx = { ...db, ...mockQuery };
					return await callback(trx as any);
				});

				await service.createOne({ name: 'Test' });

				expect(mockReturning).toHaveBeenCalledWith('id', undefined);

				transactionSpy.mockRestore();
			});
		});

		describe('createMany', () => {
			it('should validate user count if requested', async () => {
				await service.createMany([{}], { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

				expect(validateUserCountIntegrity).toHaveBeenCalled();
			});
		});

		describe('updateBatch', () => {
			it('should validate user count if requested', async () => {
				await service.updateBatch([{ id: 1 }], { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

				expect(validateUserCountIntegrity).toHaveBeenCalled();
			});
		});

		describe('updateMany', () => {
			it('should validate user count if requested', async () => {
				await service.updateMany([1], {}, { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

				expect(validateUserCountIntegrity).toHaveBeenCalled();
			});

			it('should match revision snapshots to items by primary key', async () => {
				const accountability = {
					admin: true,
					user: 'user-id',
				} as Accountability;

				service = new ItemsService('test', {
					accountability,
					knex: db,
					schema,
				});

				const readManySpy = vi.spyOn(ItemsService.prototype, 'readMany').mockResolvedValue([
					{ id: 3, status: 'published', sort: 1, name: 'third' },
					{ id: 1, status: 'published', sort: 2, name: 'first' },
					{ id: 2, status: 'published', sort: 3, name: 'second' },
				]);

				const createActivitySpy = vi.spyOn(ActivityService.prototype, 'createMany').mockResolvedValue([101, 102, 103]);

				const createRevisionsSpy = vi
					.spyOn(RevisionsService.prototype, 'createMany')
					.mockResolvedValue([201, 202, 203]);

				try {
					await service.updateMany([1, 2, 3], { status: 'published' }, { emitEvents: false });

					expect(readManySpy).toHaveBeenCalledWith([1, 2, 3], {
						fields: ['id', 'status', 'sort', 'name'],
					});

					expect(createActivitySpy).toHaveBeenCalledWith(
						[
							expect.objectContaining({ item: 1 }),
							expect.objectContaining({ item: 2 }),
							expect.objectContaining({ item: 3 }),
						],
						{ bypassLimits: true },
					);

					expect(createRevisionsSpy).toHaveBeenCalledWith([
						{
							activity: 101,
							collection: 'test',
							item: 1,
							data: { id: 1, status: 'published', sort: 2, name: 'first' },
							delta: { status: 'published' },
						},
						{
							activity: 102,
							collection: 'test',
							item: 2,
							data: { id: 2, status: 'published', sort: 3, name: 'second' },
							delta: { status: 'published' },
						},
						{
							activity: 103,
							collection: 'test',
							item: 3,
							data: { id: 3, status: 'published', sort: 1, name: 'third' },
							delta: { status: 'published' },
						},
					]);
				} finally {
					readManySpy.mockRestore();
					createActivitySpy.mockRestore();
					createRevisionsSpy.mockRestore();
				}
			});
		});

		describe('deleteMany', () => {
			it('should validate user count if requested', async () => {
				await service.deleteMany([1], { userIntegrityCheckFlags: UserIntegrityCheckFlag.All });

				expect(validateUserCountIntegrity).toHaveBeenCalled();
			});
		});

		describe('inactive collections', () => {
			const accountability = {
				user: 'user-id',
				role: 'role-id',
				admin: false,
				app: true,
				roles: [],
				ip: null,
			} as Accountability;

			// The check itself is covered in the shared utility's own tests, here we only ensure every
			// operation runs it for the action it performs
			const operations: [name: string, action: string, run: (service: ItemsService) => Promise<unknown>][] = [
				['createOne', 'create', (service) => service.createOne({ name: 'first' })],
				['createMany', 'create', (service) => service.createMany([{ name: 'first' }])],
				['readByQuery', 'read', (service) => service.readByQuery({})],
				['readOne', 'read', (service) => service.readOne(1)],
				['readMany', 'read', (service) => service.readMany([1])],
				['readSingleton', 'read', (service) => service.readSingleton({})],
				['updateOne', 'update', (service) => service.updateOne(1, { name: 'first' })],
				['updateMany', 'update', (service) => service.updateMany([1], { name: 'first' })],
				['updateBatch', 'update', (service) => service.updateBatch([{ id: 1, name: 'first' }])],
				['updateByQuery', 'update', (service) => service.updateByQuery({}, { name: 'first' })],
				['upsertOne', 'create', (service) => service.upsertOne({ name: 'first' })],
				['upsertMany', 'create', (service) => service.upsertMany([{ name: 'first' }])],
				['upsertSingleton', 'update', (service) => service.upsertSingleton({ name: 'first' })],
				['deleteOne', 'delete', (service) => service.deleteOne(1)],
				['deleteMany', 'delete', (service) => service.deleteMany([1])],
				['deleteByQuery', 'delete', (service) => service.deleteByQuery({})],
			];

			beforeEach(() => {
				vi.mocked(validateCollectionActive).mockRejectedValue(new CollectionInactiveError({ collection: 'test' }));
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);
			});

			afterEach(() => {
				vi.mocked(ItemsService.prototype.getKeysByQuery).mockRestore();
			});

			it.each(operations)('should check the collection on %s as the %s action', async (_name, action, run) => {
				const service = new ItemsService('test', { accountability, knex: db, schema });

				await expect(run(service)).rejects.toMatchObject({ code: 'COLLECTION_INACTIVE' });

				// Operations that run in a transaction pass the transaction as the knex instance
				expect(validateCollectionActive).toHaveBeenCalledWith(
					{ accountability, collection: 'test', action },
					expect.objectContaining({ schema }),
				);
			});

			it('should check the collection without accountability too', async () => {
				await expect(service.readByQuery({})).rejects.toMatchObject({ code: 'COLLECTION_INACTIVE' });

				expect(validateCollectionActive).toHaveBeenCalledWith(
					expect.objectContaining({ accountability: null }),
					expect.anything(),
				);
			});
		});

		describe('getKeysByQuery', () => {
			it('should resolve the keys through an authenticated read', async () => {
				const accountability = { user: 'test-user' } as Accountability;
				const authenticatedService = new ItemsService('test', { knex: db, schema, accountability });

				const readByQuery = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([{ id: 1 }, { id: 2 }]);

				const keys = await authenticatedService.getKeysByQuery({ filter: { id: { _gt: 0 } } });

				expect(keys).toEqual([1, 2]);
				expect(readByQuery).toHaveBeenCalledExactlyOnceWith({ filter: { id: { _gt: 0 } }, fields: ['id'] });

				expect((readByQuery.mock.contexts[0] as ItemsService).accountability).toBe(accountability);

				readByQuery.mockRestore();
			});
		});
	});
});
