import { expect, describe, test, vi, beforeEach } from 'vitest';
import { fetchPermissions } from '../permissions/lib/fetch-permissions.js';
import { fetchRolesTree } from '../permissions/lib/fetch-roles-tree.js';
import { fetchGlobalAccess } from '../permissions/modules/fetch-global-access/fetch-global-access.js';
import { getAccountabilityForRole } from './get-accountability-for-role.js';

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
			roles: [],
			role: null,
			user: null,
		});
	});

	test('get role from database', async () => {
		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ admin: false, app: true });

		const result = await getAccountabilityForRole('123-456', {
			accountability: null,
			schema: {} as any,
			database: {} as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: true,
			roles: [],
			role: '123-456',
			user: null,
		});

		expect(fetchRolesTree).toHaveBeenCalledWith('123-456', {});
		expect(fetchGlobalAccess).toHaveBeenCalledWith({}, []);
	});

	test('database invalid role returns default accountability', async () => {
		vi.mocked(fetchRolesTree).mockResolvedValue([]);
		vi.mocked(fetchGlobalAccess).mockResolvedValue({ admin: false, app: false });

		const result = await getAccountabilityForRole('456-789', {
			accountability: null,
			schema: {} as any,
			database: {} as any,
		});

		expect(result).toStrictEqual({
			admin: false,
			app: false,
			roles: [],
			role: null,
			user: null,
		});
	});
});
