import knex, { Knex } from 'knex';
import { getTracker, MockClient, Tracker } from 'knex-mock-client';
import { WebhooksService } from '.';
import { getMessenger } from '../messenger';

jest.mock('../../src/database/index', () => {
	return { __esModule: true, default: jest.fn(), getDatabaseClient: jest.fn().mockReturnValue('postgres') };
});

jest.mock('../messenger', () => {
	return { getMessenger: jest.fn().mockReturnValue({ publish: jest.fn() }) };
});

describe('Integration Tests', () => {
	let db: jest.Mocked<Knex>;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex({ client: MockClient }) as jest.Mocked<Knex>;
		tracker = getTracker();
	});

	beforeEach(() => {
		tracker.on.any('directus_webhooks').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Webhooks', () => {
		let service: WebhooksService;
		let messengerPublishSpy: jest.SpyInstance;

		beforeEach(() => {
			service = new WebhooksService({
				knex: db,
				schema: {
					collections: {
						directus_webhooks: {
							collection: 'directus_webhooks',
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
			messengerPublishSpy = jest.spyOn(getMessenger(), 'publish');
		});

		afterEach(() => {
			messengerPublishSpy.mockClear();
		});

		describe('createOne', () => {
			it('should publish webhooks reload message once', async () => {
				await service.createOne({});
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});

		describe('createMany', () => {
			it('should publish webhooks reload message once', async () => {
				await service.createMany([{}]);
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});

		describe('updateOne', () => {
			it('should publish webhooks reload message once', async () => {
				await service.updateOne(1, {});
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});

		describe('updateMany', () => {
			it('should publish webhooks reload message once', async () => {
				await service.updateMany([1], {});
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteOne', () => {
			it('should publish webhooks reload message once', async () => {
				await service.deleteOne(1);
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});

		describe('deleteMany', () => {
			it('should publish webhooks reload message once', async () => {
				await service.deleteMany([1]);
				expect(messengerPublishSpy).toBeCalledTimes(1);
			});
		});
	});
});
