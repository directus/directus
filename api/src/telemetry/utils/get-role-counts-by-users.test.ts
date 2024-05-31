import { randomUUID } from 'crypto';
import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getRoleCountsByUsers } from './get-role-counts-by-users.js';

let mockResult: { admin_access: number | null; app_access: number | null; count: string }[];
let mockDb: Knex;

beforeEach(() => {
	mockResult = [
		{
			admin_access: 1,
			app_access: 1,
			count: '11',
		},
		{
			admin_access: 0,
			app_access: 1,
			count: '22',
		},
		{
			admin_access: 0,
			app_access: 0,
			count: '33',
		},
		{
			admin_access: 1,
			app_access: 0,
			count: '44',
		},
		{
			// For users with no role
			admin_access: null,
			app_access: null,
			count: '55',
		},
	];

	mockDb = {
		count: vi.fn().mockReturnThis(),
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		whereIn: vi.fn().mockReturnThis(),
		andWhere: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Fetches active ccounts from the database', async () => {
	const userIds = [randomUUID(), randomUUID(), randomUUID()];
	await getRoleCountsByUsers(mockDb, userIds);

	expect(mockDb.count).toHaveBeenCalledWith('directus_users.id', { as: 'count' });
	expect(mockDb.select).toHaveBeenCalledWith('directus_roles.admin_access', 'directus_roles.app_access');
	expect(mockDb.from).toHaveBeenCalledWith('directus_users');
	expect(mockDb.whereIn).toHaveBeenCalledWith('directus_users.id', userIds);
	expect(mockDb.andWhere).toHaveBeenCalledWith('directus_users.status', '=', 'active');
	expect(mockDb.leftJoin).toHaveBeenCalledWith('directus_roles', 'directus_users.role', '=', 'directus_roles.id');
	expect(mockDb.groupBy).toHaveBeenCalledWith('directus_roles.admin_access', 'directus_roles.app_access');
});

test('Fetches inactive counts from the database', async () => {
	const userIds = [randomUUID(), randomUUID(), randomUUID()];
	await getRoleCountsByUsers(mockDb, userIds, { inactiveUsers: true });

	expect(mockDb.count).toHaveBeenCalledWith('directus_users.id', { as: 'count' });
	expect(mockDb.select).toHaveBeenCalledWith('directus_roles.admin_access', 'directus_roles.app_access');
	expect(mockDb.from).toHaveBeenCalledWith('directus_users');
	expect(mockDb.whereIn).toHaveBeenCalledWith('directus_users.id', userIds);
	expect(mockDb.andWhere).toHaveBeenCalledWith('directus_users.status', '!=', 'active');
	expect(mockDb.leftJoin).toHaveBeenCalledWith('directus_roles', 'directus_users.role', '=', 'directus_roles.id');
	expect(mockDb.groupBy).toHaveBeenCalledWith('directus_roles.admin_access', 'directus_roles.app_access');
});

test('Sets final counts based on combination of admin/app access', async () => {
	const res = await getRoleCountsByUsers(mockDb, []);

	expect(res).toEqual({
		admin: 55,
		app: 22,
		api: 88,
	});
});
