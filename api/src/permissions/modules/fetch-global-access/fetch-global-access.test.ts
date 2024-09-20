import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { _fetchGlobalAccess as fetchGlobalAccess } from './fetch-global-access.js';
import { fetchGlobalAccessForRoles } from './lib/fetch-global-access-for-roles.js';
import { fetchGlobalAccessForUser } from './lib/fetch-global-access-for-user.js';

let knex: Knex;

vi.mock('./lib/fetch-global-access-for-roles.js');
vi.mock('./lib/fetch-global-access-for-user.js');

beforeEach(() => {
	vi.clearAllMocks();

	knex = {} as unknown as Knex;
});

test('Returns result from access for roles when no user is passed', async () => {
	const mockRolesAccess = { app: true, admin: true };
	vi.mocked(fetchGlobalAccessForRoles).mockResolvedValue(mockRolesAccess);

	const res = await fetchGlobalAccess({} as Accountability, knex);

	expect(res).toEqual(mockRolesAccess);
});

test('Returns highest result if user is passed', async () => {
	const mockRolesAccess = { app: true, admin: true };
	const mockUserAccess = { app: false, admin: false };
	vi.mocked(fetchGlobalAccessForRoles).mockResolvedValue(mockRolesAccess);
	vi.mocked(fetchGlobalAccessForUser).mockResolvedValue(mockUserAccess);

	const res = await fetchGlobalAccess({ user: 'user', roles: [] }, knex);

	expect(res).toEqual({ app: true, admin: true });
});

test('Combines result of role and user', async () => {
	const mockRolesAccess = { app: false, admin: true };
	const mockUserAccess = { app: true, admin: false };
	vi.mocked(fetchGlobalAccessForRoles).mockResolvedValue(mockRolesAccess);
	vi.mocked(fetchGlobalAccessForUser).mockResolvedValue(mockUserAccess);

	const res = await fetchGlobalAccess({ user: 'user', roles: [] }, knex);

	expect(res).toEqual({ app: true, admin: true });
});
