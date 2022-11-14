import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { FlowsService } from '.';
import { getFlowManager } from '../flows';

jest.mock('../../src/database/index', () => {
	return { __esModule: true, default: jest.fn(), getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

jest.mock('../flows', () => {
	return { getFlowManager: jest.fn().mockReturnValue({ reload: jest.fn() }) };
});

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_flows').response({});
		tracker.on.update('directus_operations').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Flows', () => {
		let service: FlowsService;
		let flowManagerReloadSpy: jest.SpyInstance;

		beforeEach(() => {
			service = new FlowsService({
				knex: db,
				schema: {
					collections: {
						directus_flows: {
							collection: 'directus_flows',
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
			flowManagerReloadSpy = jest.spyOn(getFlowManager(), 'reload');
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
			it('should update operations once and reload flows once', async () => {
				await service.deleteOne(1);

				const updateOperationsCalls = tracker.history.update.filter((query) =>
					query.sql.includes(`update "directus_operations" set "resolve" = ?, "reject" = ? where "flow"`)
				).length;

				expect(updateOperationsCalls).toBe(1);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should update operations once and reload flows once', async () => {
				await service.deleteMany([1]);

				const updateOperationsCalls = tracker.history.update.filter((query) =>
					query.sql.includes(`update "directus_operations" set "resolve" = ?, "reject" = ? where "flow"`)
				).length;

				expect(updateOperationsCalls).toBe(1);
				expect(flowManagerReloadSpy).toBeCalledTimes(1);
			});
		});
	});
});
