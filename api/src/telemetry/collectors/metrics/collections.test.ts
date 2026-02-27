import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectCollectionMetrics } from './collections.js';

vi.mock('../../utils/get-item-count.js', () => ({
	getItemCount: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../utils/stats.js', () => ({
	distributionFromCounts: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
	emptyDistribution: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectCollectionMetrics', () => {
	const mockDb = {
		__esModule: true,
		default: vi.fn(),
	} as unknown as Knex;

	const emptySchema = { collections: {} } as unknown as SchemaOverview;

	test('returns zeroes when no user collections', async () => {
		const result = await collectCollectionMetrics(mockDb, emptySchema);
		expect(result.count).toBe(0);
		expect(result._totalItems).toBe(0);
		expect(result._totalFields).toBe(0);
	});

	test('counts user collections excluding directus_ prefix', async () => {
		const schemaWithCollections = {
			collections: {
				directus_users: { collection: 'directus_users' },
				articles: { collection: 'articles' },
				categories: { collection: 'categories' },
			},
		} as unknown as SchemaOverview;

		const mockKnex = vi.fn().mockReturnValue({
			select: vi.fn().mockReturnThis(),
			count: vi.fn().mockReturnThis(),
			min: vi.fn().mockReturnThis(),
			max: vi.fn().mockReturnThis(),
			avg: vi.fn().mockReturnThis(),
			groupBy: vi.fn().mockReturnThis(),
			whereIn: vi.fn().mockResolvedValue([]),
		});

		const result = await collectCollectionMetrics(mockKnex as unknown as Knex, schemaWithCollections);
		expect(result.count).toBe(2);
	});
});
