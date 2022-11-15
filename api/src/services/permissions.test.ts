import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest';
import { ItemsService, PermissionsService } from '.';
import * as cache from '../cache';

vi.mock('../../src/database/index', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

describe('Integration Tests', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_permissions').response({});
		tracker.on
			.select(
				/"directus_permissions"."id" from "directus_permissions" order by "directus_permissions"."id" asc limit .*/
			)
			.response([]);
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Permissions', () => {
		let service: PermissionsService;
		let clearSystemCacheSpy: SpyInstance;

		beforeEach(() => {
			service = new PermissionsService({
				knex: db,
				schema: {
					collections: {
						directus_permissions: {
							collection: 'directus_permissions',
							primary: 'id',
							singleton: false,
							sortField: null,
							note: null,
							accountability: null,
							fields: {
								id: {
									field: 'id',
									defaultValue: null,
									nullable: false,
									generated: true,
									type: 'integer',
									dbType: 'integer',
									precision: null,
									scale: null,
									special: [],
									note: null,
									validation: null,
									alias: false,
								},
							},
						},
					},
					relations: [],
				},
			});
			clearSystemCacheSpy = vi.spyOn(cache, 'clearSystemCache').mockResolvedValue();
		});

		afterEach(() => {
			clearSystemCacheSpy.mockClear();
		});

		describe('createOne', () => {
			it('should clearSystemCache once', async () => {
				await service.createOne({});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('createMany', () => {
			it('should clearSystemCache once', async () => {
				await service.createMany([{}]);
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('updateOne', () => {
			it('should clearSystemCache once', async () => {
				await service.updateOne(1, {});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('updateMany', () => {
			it('should clearSystemCache once', async () => {
				await service.updateMany([1], {});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('updateBatch', () => {
			it('should clearSystemCache once', async () => {
				await service.updateBatch([{ id: 1 }]);
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('updateByQuery', () => {
			it('should clearSystemCache once', async () => {
				// mock return value for following empty query
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);
				await service.updateByQuery({}, {});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('upsertOne', () => {
			it('should clearSystemCache once', async () => {
				await service.upsertOne({});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('upsertMany', () => {
			it('should clearSystemCache once', async () => {
				await service.upsertMany([{ id: 1 }]);
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteOne', () => {
			it('should clearSystemCache once', async () => {
				await service.deleteOne(1);
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should clearSystemCache once', async () => {
				await service.deleteMany([1]);
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteByQuery', () => {
			it('should clearSystemCache once', async () => {
				// mock return value for following empty query
				vi.spyOn(ItemsService.prototype, 'getKeysByQuery').mockResolvedValue([1]);
				await service.deleteByQuery({});
				expect(clearSystemCacheSpy).toBeCalledTimes(1);
			});
		});
	});
});
