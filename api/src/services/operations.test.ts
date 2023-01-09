import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, SpyInstance, vi } from 'vitest';
import { OperationsService } from '.';
import { getFlowManager } from '../flows';

vi.mock('../../src/database/index', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

vi.mock('../flows', () => {
	return { getFlowManager: vi.fn().mockReturnValue({ reload: vi.fn() }) };
});

describe('Integration Tests', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient });
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_operations').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Operations', () => {
		let service: OperationsService;
		let flowManagerReloadSpy: SpyInstance;

		beforeEach(() => {
			service = new OperationsService({
				knex: db,
				schema: {
					collections: {
						directus_operations: {
							collection: 'directus_operations',
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
			flowManagerReloadSpy = vi.spyOn(getFlowManager(), 'reload');
		});

		afterEach(() => {
			flowManagerReloadSpy.mockClear();
		});

		describe('createOne', () => {
			it('should reload flows once', async () => {
				await service.createOne({});
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('createMany', () => {
			it('should reload flows once', async () => {
				await service.createMany([{}]);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('updateOne', () => {
			it('should reload flows once', async () => {
				await service.updateOne(1, {});
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('updateBatch', () => {
			it('should reload flows once', async () => {
				await service.updateBatch([{ id: 1 }]);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('updateMany', () => {
			it('should reload flows once', async () => {
				await service.updateMany([1], {});
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteOne', () => {
			it('should reload flows once', async () => {
				await service.deleteOne(1);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should reload flows once', async () => {
				await service.deleteMany([1]);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});
	});
});
