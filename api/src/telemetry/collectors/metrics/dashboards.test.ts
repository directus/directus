import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectDashboardMetrics } from './dashboards.js';

vi.mock('../../../services/dashboards.js', () => ({
	DashboardsService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock('../../utils/stats.js', () => ({
	distributionFromCounts: vi.fn().mockReturnValue({ min: 1, max: 5, median: 3, mean: 3 }),
	emptyDistribution: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { DashboardsService } from '../../../services/dashboards.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectDashboardMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns zero count when no dashboards', async () => {
		const result = await collectDashboardMetrics(mockDb, mockSchema);
		expect(result.count).toBe(0);
		expect(result.panels).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('calculates panel distribution for dashboards', async () => {
		vi.mocked(DashboardsService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ panels: 3 },
				{ panels: 5 },
				{ panels: 1 },
			]),
		}) as any);

		const result = await collectDashboardMetrics(mockDb, mockSchema);
		expect(result.count).toBe(3);
		expect(result.panels).toEqual({ min: 1, max: 5, median: 3, mean: 3 });
	});
});
