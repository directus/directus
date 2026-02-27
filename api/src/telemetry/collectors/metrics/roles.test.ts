import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectRoleMetrics } from './roles.js';

vi.mock('../../../services/roles.js', () => ({
	RolesService: vi.fn().mockImplementation(() => ({
		readByQuery: vi.fn().mockResolvedValue([]),
	})),
}));

vi.mock('../../utils/stats.js', () => ({
	distributionFromCounts: vi.fn().mockReturnValue({ min: 1, max: 5, median: 3, mean: 3 }),
	emptyDistribution: vi.fn().mockReturnValue({ min: 0, max: 0, median: 0, mean: 0 }),
}));

import type { Knex } from 'knex';
import type { SchemaOverview } from '@directus/types';
import { RolesService } from '../../../services/roles.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectRoleMetrics', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns zero count and empty distributions when no roles', async () => {
		const result = await collectRoleMetrics(mockDb, mockSchema);
		expect(result.count).toBe(0);
		expect(result.users).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
		expect(result.policies).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
		expect(result.roles).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('returns distributions when roles exist', async () => {
		vi.mocked(RolesService).mockImplementation(() => ({
			readByQuery: vi.fn().mockResolvedValue([
				{ users: 3, children: 0, policies: 2 },
				{ users: 5, children: 1, policies: 1 },
			]),
		}) as any);

		const result = await collectRoleMetrics(mockDb, mockSchema);
		expect(result.count).toBe(2);
		expect(result.users).toEqual({ min: 1, max: 5, median: 3, mean: 3 });
	});
});
