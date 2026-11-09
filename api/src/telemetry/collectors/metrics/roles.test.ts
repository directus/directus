import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RolesService } from '../../../services/roles.js';
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
		expect(result.children).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
		expect(result.depth).toEqual({ min: 0, max: 0, median: 0, mean: 0 });
	});

	test('returns distributions when roles exist', async () => {
		vi.mocked(RolesService).mockImplementation(
			() =>
				({
					readByQuery: vi.fn().mockResolvedValue([
						{ id: 'a', parent: null, users_count: '3', children_count: '1', policies_count: '2' },
						{ id: 'b', parent: 'a', users_count: '5', children_count: '0', policies_count: '1' },
					]),
				}) as any,
		);

		const result = await collectRoleMetrics(mockDb, mockSchema);
		expect(result.count).toBe(2);
		expect(result.users).toEqual({ min: 1, max: 5, median: 3, mean: 3 });
		expect(result.children).toEqual({ min: 1, max: 5, median: 3, mean: 3 });
		expect(result.depth).toEqual({ min: 1, max: 5, median: 3, mean: 3 });
	});

	test('queries with id, parent, and count fields', async () => {
		const mockReadByQuery = vi.fn().mockResolvedValue([]);

		vi.mocked(RolesService).mockImplementation(
			() =>
				({
					readByQuery: mockReadByQuery,
				}) as any,
		);

		await collectRoleMetrics(mockDb, mockSchema);

		expect(mockReadByQuery).toHaveBeenCalledWith({
			fields: ['id', 'parent', 'count(users)', 'count(children)', 'count(policies)'],
			limit: -1,
		});
	});
});
