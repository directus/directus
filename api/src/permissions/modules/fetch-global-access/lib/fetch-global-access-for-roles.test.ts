import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { fetchGlobalAccessForRoles } from './fetch-global-access-for-roles.js';

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

	const res = await fetchGlobalAccessForRoles(knex, ['role-a', 'role-b']);

	expect(knex.where).toHaveBeenCalledWith('role', 'in', ['role-a', 'role-b']);
	expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, 'gar-role-a_role-b');
	expect(res).toBe(mockResult);
});
