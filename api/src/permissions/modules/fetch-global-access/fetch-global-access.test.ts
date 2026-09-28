import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock('../../cache.js', () => ({
	useCache: () => ({
		get: mockGet,
		set: mockSet,
	}),
}));

const fetchGlobalAccessForRoles = vi.fn();
const fetchGlobalAccessForUser = vi.fn();

vi.mock('@directus/utils/node', () => ({
	fetchGlobalAccessForRoles: (...args: unknown[]) => fetchGlobalAccessForRoles(...args),
	fetchGlobalAccessForUser: (...args: unknown[]) => fetchGlobalAccessForUser(...args),
}));

const { fetchGlobalAccess } = await import('./fetch-global-access.js');

const knex = {} as Knex;

/** Cache keys used by the outer `fetchGlobalAccess` wrapper, ignoring the per-role/per-user ones */
function globalAccessKeys() {
	return mockGet.mock.calls
		.map(([key]) => key as string)
		.filter((key) => key.startsWith('global-access-') && !/^global-access-(roles|user)-/.test(key));
}

beforeEach(() => {
	vi.clearAllMocks();
	mockGet.mockResolvedValue(undefined);
	fetchGlobalAccessForRoles.mockResolvedValue({ app: false, admin: false });
	fetchGlobalAccessForUser.mockResolvedValue({ app: false, admin: false });
});

test('uses a different cache key per accountability IP', async () => {
	const accountability: Pick<Accountability, 'user' | 'roles' | 'ip'> = {
		user: 'user-a',
		roles: ['role-a'],
		ip: '10.0.0.1',
	};

	await fetchGlobalAccess(accountability, { knex });
	await fetchGlobalAccess({ ...accountability, ip: '192.168.0.1' }, { knex });

	const [allowedKey, deniedKey] = globalAccessKeys();

	expect(allowedKey).toBeDefined();
	expect(allowedKey).not.toBe(deniedKey);
});

test('reuses the cache key for the same accountability IP', async () => {
	const accountability: Pick<Accountability, 'user' | 'roles' | 'ip'> = {
		user: 'user-a',
		roles: ['role-a'],
		ip: '10.0.0.1',
	};

	await fetchGlobalAccess(accountability, { knex });
	await fetchGlobalAccess({ ...accountability }, { knex });

	const [firstKey, secondKey] = globalAccessKeys();

	expect(firstKey).toBeDefined();
	expect(firstKey).toBe(secondKey);
});

test('passes the accountability IP through to the per-role and per-user lookups', async () => {
	await fetchGlobalAccess({ user: 'user-a', roles: ['role-a'], ip: '10.0.0.1' }, { knex });

	expect(fetchGlobalAccessForRoles).toHaveBeenCalledWith(['role-a'], { knex, ip: '10.0.0.1' });
	expect(fetchGlobalAccessForUser).toHaveBeenCalledWith('user-a', { knex, ip: '10.0.0.1' });
});
