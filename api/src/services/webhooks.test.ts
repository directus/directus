import type { Knex } from 'knex';
import knex from 'knex';
import { createTracker, MockClient, Tracker } from 'knex-mock-client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { useBus } from '../bus/index.js';
import { WebhooksService } from './index.js';
import { SchemaBuilder } from '@directus/schema-builder';

vi.mock('../../src/database/index', () => {
	return { __esModule: true, default: vi.fn(), getDatabaseClient: vi.fn().mockReturnValue('postgres') };
});

vi.mock('../messenger', () => {
	return { getMessenger: vi.fn().mockReturnValue({ publish: vi.fn(), subscribe: vi.fn() }) };
});

describe('Integration Tests', () => {
	let db: Knex;
	let tracker: Tracker;

	beforeAll(async () => {
		db = knex.default({ client: MockClient });
		tracker = createTracker(db);
	});

	beforeEach(() => {
		tracker.on.any('directus_webhooks').response({});
	});

	afterEach(() => {
		tracker.reset();
	});

	describe('Services / Webhooks', () => {
		let service: WebhooksService;
		let messengerPublishSpy: MockInstance;

		const schema = new SchemaBuilder()
			.collection('directus_webhooks', (c) => {
				c.field('id').integer().primary().options({
					nullable: false,
				});
			})
			.build();

		beforeEach(() => {
			service = new WebhooksService({
				knex: db,
				schema,
			});

			messengerPublishSpy = vi.spyOn(useBus(), 'publish');
		});

		afterEach(() => {
			messengerPublishSpy.mockClear();
		});

		describe('createOne', () => {
			it('should error because of deprecation', async () => {
				await expect(service.createOne()).rejects.toMatchObject({
					code: 'METHOD_NOT_ALLOWED',
					message: 'Webhooks are deprecated, use Flows instead',
					status: 405,
				});
			});
		});

		describe('createMany', () => {
			it('should error because of deprecation', async () => {
				await expect(service.createMany()).rejects.toMatchObject({
					code: 'METHOD_NOT_ALLOWED',
					message: 'Webhooks are deprecated, use Flows instead',
					status: 405,
				});
			});
		});

		describe('updateOne', () => {
			it('should error because of deprecation', async () => {
				await expect(service.updateOne(1, {})).rejects.toMatchObject({
					code: 'METHOD_NOT_ALLOWED',
					message: 'Webhooks are deprecated, use Flows instead',
					status: 405,
				});
			});
		});

		describe('updateMany', () => {
			it('should error because of deprecation', async () => {
				await expect(service.updateMany()).rejects.toMatchObject({
					code: 'METHOD_NOT_ALLOWED',
					message: 'Webhooks are deprecated, use Flows instead',
					status: 405,
				});
			});
		});

		describe('updateBatch', () => {
			it('should error because of deprecation', async () => {
				await expect(service.updateBatch()).rejects.toMatchObject({
					code: 'METHOD_NOT_ALLOWED',
					message: 'Webhooks are deprecated, use Flows instead',
					status: 405,
				});
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
