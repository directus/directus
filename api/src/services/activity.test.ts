import { SchemaBuilder } from '@directus/schema-builder';
import type { Query } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLicenseEntitlements } from '../license/summary.js';
import { ActivityService } from './activity.js';
import { ItemsService } from './items.js';

vi.mock('../../src/database/index', () => ({
	default: vi.fn(),
}));

vi.mock('../license/summary.js', async () => {
	const actual = await vi.importActual<typeof import('../license/summary.js')>('../license/summary.js');
	return {
		...actual,
		getLicenseEntitlements: vi.fn(),
	};
});

const schema = new SchemaBuilder()
	.collection('directus_activity', (collection) => {
		collection.field('id').integer().primary();
		collection.field('timestamp').dateTime();
	})
	.build();

describe('ActivityService', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-11T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('applies the history filter and merges it with the existing query filter', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			activity_history_days: { limit: 30 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new ActivityService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				user: {
					_eq: 'test-user',
				},
			},
		};

		await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(
			{
				filter: {
					_and: [
						{
							timestamp: {
								_gte: '2026-03-12T00:00:00.000Z',
							},
						},
						query.filter,
					],
				},
			},
			undefined,
		);
	});

	it('leaves the query unchanged when the history limit is invalid', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			activity_history_days: { limit: -1 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new ActivityService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				user: {
					_eq: 'test-user',
				},
			},
		};

		await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(query, undefined);
	});

	it('denies all history when the limit is zero', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			activity_history_days: { limit: 0 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new ActivityService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				user: {
					_eq: 'test-user',
				},
			},
		};

		await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(
			{
				filter: {
					_and: [
						{
							id: {
								_null: true,
							},
						},
						query.filter,
					],
				},
			},
			undefined,
		);
	});
});
