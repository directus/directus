import type { GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { fetchGlobalAccessForUser } from './fetch-global-access-for-user.js';

vi.mock('../utils/fetch-global-access-for-query.js');

describe('fetchGlobalAccessForUser', () => {
	let knex: Knex;

	beforeEach(() => {
		vi.clearAllMocks();

		knex = {
			where: vi.fn(),
		} as unknown as Knex;
	});

	test('Returns result of fetchGlobalAccessForQuery with user query and null ip', async () => {
		const mockResult = {} as GlobalAccess;
		const mockKnex = {} as Knex.QueryBuilder;
		vi.mocked(knex.where).mockReturnValue(mockKnex);
		vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

		const user = 'user-a';

		const res = await fetchGlobalAccessForUser(user, { knex });

		expect(knex.where).toHaveBeenCalledWith('user', '=', 'user-a');
		expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, { ip: null });
		expect(res).toBe(mockResult);
	});

	test('Returns result fetchGlobalAccessForQuery with user query and ip', async () => {
		const mockResult = {} as GlobalAccess;
		const mockKnex = {} as Knex.QueryBuilder;
		vi.mocked(knex.where).mockReturnValue(mockKnex);
		vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

		const user = 'user-a';
		const ip = '10.20.30.40';

		const res = await fetchGlobalAccessForUser(user, { knex, ip });

		expect(knex.where).toHaveBeenCalledWith('user', '=', 'user-a');
		expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, { ip });
		expect(res).toBe(mockResult);
	});
});
