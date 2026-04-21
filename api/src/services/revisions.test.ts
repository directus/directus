import { SchemaBuilder } from '@directus/schema-builder';
import type { Query } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLicenseEntitlements } from '../license/summary.js';
import { ItemsService } from './items.js';
import { RevisionsService } from './revisions.js';

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
	.collection('directus_revisions', (collection) => {
		collection.field('id').integer().primary();
	})
	.build();

describe('RevisionsService', () => {
	const db = vi.mocked(knex.default({ client: MockClient }));

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-04-11T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('applies the nested activity history filter and merges it with the existing query filter', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			revisions_history_days: { limit: 14 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new RevisionsService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				collection: {
					_eq: 'posts',
				},
			},
		};

		await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(
			{
				filter: {
					_and: [
						{
							activity: {
								timestamp: {
									_gte: '2026-03-28T00:00:00.000Z',
								},
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
			revisions_history_days: { limit: -1 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new RevisionsService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				collection: {
					_eq: 'posts',
				},
			},
		};

		await service.readByQuery(query);

		expect(readByQuerySpy).toHaveBeenCalledWith(query, undefined);
	});

	it('denies all history when the limit is zero', async () => {
		vi.mocked(getLicenseEntitlements).mockResolvedValue({
			revisions_history_days: { limit: 0 },
		} as any);

		const readByQuerySpy = vi.spyOn(ItemsService.prototype, 'readByQuery').mockResolvedValue([]);

		const service = new RevisionsService({
			knex: db,
			schema,
		});

		const query: Query = {
			filter: {
				collection: {
					_eq: 'posts',
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
