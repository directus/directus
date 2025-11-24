import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
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

test('Returns result of fetchGlobalAccessForQuery with roles and accountability', async () => {
	const mockResult = {} as GlobalAccess;
	const mockKnex = {} as Knex.QueryBuilder;
	vi.mocked(knex.where).mockReturnValue(mockKnex);
	vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

	const accountability = { user: 'user-a' } as Accountability;

	const res = await fetchGlobalAccessForUser(accountability, { knex });

	expect(knex.where).toHaveBeenCalledWith('user', '=', 'user-a');
	expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, accountability);
	expect(res).toBe(mockResult);
});
