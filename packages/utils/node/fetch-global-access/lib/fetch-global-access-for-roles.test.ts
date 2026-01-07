import type { GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { fetchGlobalAccessForRoles } from './fetch-global-access-for-roles.js';

vi.mock('../utils/fetch-global-access-for-query.js');

describe('fetchGlobalAccessForRoles', () => {
	let knex: Knex;

	beforeEach(() => {
		vi.clearAllMocks();

		knex = {
			where: vi.fn(),
		} as unknown as Knex;
	});

	test('Returns result of fetchGlobalAccessForQuery with roles query and null ip', async () => {
		const mockResult = {} as GlobalAccess;
		const mockKnex = {} as Knex.QueryBuilder;
		vi.mocked(knex.where).mockReturnValue(mockKnex);
		vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

		const roles = ['role-a', 'role-b'];

		const res = await fetchGlobalAccessForRoles(roles, { knex });

		expect(knex.where).toHaveBeenCalledWith('role', 'in', ['role-a', 'role-b']);
		expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, { ip: null });
		expect(res).toBe(mockResult);
	});

	test('Returns result of fetchGlobalAccessForQuery with roles query and ip', async () => {
		const mockResult = {} as GlobalAccess;
		const mockKnex = {} as Knex.QueryBuilder;
		vi.mocked(knex.where).mockReturnValue(mockKnex);
		vi.mocked(fetchGlobalAccessForQuery).mockResolvedValue(mockResult);

		const roles = ['role-a', 'role-b'];
		const ip = '10.20.30.40';

		const res = await fetchGlobalAccessForRoles(roles, { knex, ip });

		expect(knex.where).toHaveBeenCalledWith('role', 'in', ['role-a', 'role-b']);
		expect(fetchGlobalAccessForQuery).toHaveBeenCalledWith(mockKnex, { ip });
		expect(res).toBe(mockResult);
	});
});
