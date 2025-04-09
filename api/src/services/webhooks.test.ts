import { createError, ErrorCode } from '@directus/errors';
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

		const errorDeprecation = new (createError(
			ErrorCode.MethodNotAllowed,
			'Webhooks are deprecated, use Flows instead',
			405,
		))();

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
				return expect(service.createOne({})).rejects.toEqual(errorDeprecation);
			});
		});

		describe('createMany', () => {
			it('should error because of deprecation', async () => {
				return expect(service.createMany([{}])).rejects.toEqual(errorDeprecation);
			});
		});

		describe('updateOne', () => {
			it('should error because of deprecation', async () => {
				return expect(service.updateOne(1, {})).rejects.toEqual(errorDeprecation);
			});
		});

		describe('updateMany', () => {
			it('should error because of deprecation', async () => {
				return expect(service.updateMany([1], {})).rejects.toEqual(errorDeprecation);
			});
		});

		describe('updateBatch', () => {
			it('should error because of deprecation', async () => {
				return expect(service.updateBatch()).rejects.toEqual(errorDeprecation);
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
