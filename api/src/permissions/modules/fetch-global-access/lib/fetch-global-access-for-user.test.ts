import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { fetchGlobalAccessForUser } from './fetch-global-access-for-user.js';

vi.mock('../utils/fetch-global-access-for-query.js');

let knex: Knex;

beforeEach(() => {
	vi.clearAllMocks();

	knex = {
		where: vi.fn(),
	} as unknown as Knex;
});

test('Returns result of fetchGlobalAccessForQuery with roles query + cache key', async () => {
	const mockResult = {} as GlobalAccess;
	const mockKnex = {} as Knex.QueryBuilder;
	vi.mocked(knex.where).mockReturnValue(mockKnex);
	vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

	const res = await fetchGlobalAccessForUser(knex, 'user-a');

	expect(knex.where).toHaveBeenCalledWith('user', 'eq', 'user-a');
	expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, 'gau-user-a');
	expect(res).toBe(mockResult);
});
