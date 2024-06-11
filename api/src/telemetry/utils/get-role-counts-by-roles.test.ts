import { randomUUID } from 'crypto';
import { type Knex } from 'knex';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { getRoleCountsByRoles } from './get-role-counts-by-roles.js';

let mockResult: { id: string; admin_access: number | null; app_access: number | null }[];
let mockDb: Knex;

beforeEach(() => {
	mockResult = [
		// Admin
		{
			id: randomUUID(),
			admin_access: 1,
			app_access: 1,
		},
		{
			id: randomUUID(),
			admin_access: 1,
			app_access: 1,
		},
		// App
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 1,
		},
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 1,
		},
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 1,
		},
		// API
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 0,
		},
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 0,
		},
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 0,
		},
		{
			id: randomUUID(),
			admin_access: 0,
			app_access: 0,
		},
	];

	mockDb = {
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		whereIn: vi.fn().mockResolvedValue(mockResult),
	} as unknown as Knex;
});

afterEach(() => {
	vi.clearAllMocks();
});

test('Fetches counts from the database', async () => {
	const roleIds = [randomUUID(), randomUUID(), randomUUID()];
	await getRoleCountsByRoles(mockDb, roleIds);

	expect(mockDb.select).toHaveBeenCalledWith('id', 'admin_access', 'app_access');
	expect(mockDb.from).toHaveBeenCalledWith('directus_roles');
	expect(mockDb.whereIn).toHaveBeenCalledWith('id', roleIds);
});

test('Returns role counts based on combination of admin/app access', async () => {
	const res = await getRoleCountsByRoles(mockDb, []);

	expect(res).toEqual({
		admin: 2,
		app: 3,
		api: 4,
	});
});
