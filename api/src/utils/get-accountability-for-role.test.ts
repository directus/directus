import { getAccountabilityForRole } from './get-accountability-for-role.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('./get-permissions', () => ({
	getPermissions: vi.fn().mockReturnValue([]),
}));

vi.mock('../permissions/modules/fetch-global-access/fetch-global-access.ts');
vi.mock('../permissions/lib/fetch-roles-tree.js');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getAccountabilityForRole', async () => {
	test('no role', async () => {
		const result = await getAccountabilityForRole(null, {
			accountability: null,
			schema: {} as any,
			database: vi.fn() as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: false,
			ip: null,
			roles: [],
			role: null,
			user: null,
		});
	});

	test('system role', async () => {
		const result = await getAccountabilityForRole('system', {
			accountability: null,
			schema: {} as any,
			database: vi.fn() as any,
		});

		expect(result).toStrictEqual({
			admin: true,
			app: true,
			ip: null,
			roles: [],
			role: null,
			user: null,
		});
	});

	test('get role and role tree from database', async () => {
		const roles = ['123-456', '234-567'];
		vi.mocked(fetchRolesTree).mockResolvedValue(roles);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ admin: false, app: true });

		const result = await getAccountabilityForRole('123-456', {
			accountability: null,
			schema: {} as any,
			database: {} as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: true,
			roles: roles,
			role: '123-456',
			user: null,
			ip: null,
		});

		expect(fetchRolesTree).toHaveBeenCalledWith('123-456', { knex: {} });
		expect(fetchGlobalAccess).toHaveBeenCalledWith({ roles, user: null, ip: null }, { knex: {} });
	});

	test('invalid role throws error', async () => {
		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ admin: false, app: false });

		await expect(
			getAccountabilityForRole('456-789', {
				accountability: null,
				schema: {} as any,
				database: {} as any,
			}),
		).rejects.toThrowErrorMatchingInlineSnapshot(
			`[Error: Configured role "456-789" isn't a valid role ID or doesn't exist.]`,
		);
	});
});
