import type { Knex } from 'knex';
import { beforeEach, expect, test, vi } from 'vitest';
import { fetchRolesTree } from '../../permissions/lib/fetch-roles-tree.js';
import { fetchAccessLookup } from './fetch-access-lookup.js';
import { fetchActiveUsers } from './fetch-active-users.js';
import { fetchUserCount } from './fetch-user-count.js';

vi.mock('./fetch-access-lookup.js');
vi.mock('./fetch-active-users.js');
vi.mock('../../permissions/lib/fetch-roles-tree.js');

let knex: Knex;

beforeEach(() => {
	vi.clearAllMocks();

	knex = {} as Knex;

	vi.mocked(fetchAccessLookup).mockResolvedValue([]);
	vi.mocked(fetchActiveUsers).mockResolvedValue([]);
	vi.mocked(fetchRolesTree).mockResolvedValue([]);
});

test('Returns correct count when user has admin access policy directly associated', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: 'user-a',
			role: null,
			admin_access: true,
			app_access: false,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: null,
		},
	]);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 1,
		app: 0,
		api: 0,
	});
});

test('Returns correct count when user has app access policy directly associated', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: 'user-a',
			role: null,
			admin_access: false,
			app_access: true,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: null,
		},
	]);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 0,
		app: 1,
		api: 0,
	});
});

test('Looks up admin status from user role if not directly associated', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: null,
			role: 'role-a',
			admin_access: true,
			app_access: false,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: 'role-a',
		},
	]);

	vi.mocked(fetchRolesTree).mockResolvedValue(['role-a']);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 1,
		app: 0,
		api: 0,
	});
});

test('Looks up app status from user role if not directly associated', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: null,
			role: 'role-a',
			admin_access: false,
			app_access: true,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: 'role-a',
		},
	]);

	vi.mocked(fetchRolesTree).mockResolvedValue(['role-a']);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 0,
		app: 1,
		api: 0,
	});
});

test('Reads admin status from parent tree', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: null,
			role: 'role-c',
			admin_access: true,
			app_access: false,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: 'role-a',
		},
	]);

	vi.mocked(fetchRolesTree).mockResolvedValue(['role-c', 'role-b', 'role-a']);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 1,
		app: 0,
		api: 0,
	});
});

test('Prioritizes admin over app', async () => {
	// Eg we don't want to double-count. If you're an admin, app access is implied

	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: null,
			role: 'role-a',
			admin_access: true,
			app_access: true,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: 'role-a',
		},
	]);

	vi.mocked(fetchRolesTree).mockResolvedValue(['role-a']);

	const counts = await fetchUserCount({ knex });

	expect(counts).toEqual({
		admin: 1,
		app: 0,
		api: 0,
	});
});

test('More complicated example of the above', async () => {
	vi.mocked(fetchAccessLookup).mockResolvedValue([
		{
			user: null,
			role: 'role-a',
			admin_access: false,
			app_access: false,
		},
		{
			user: null,
			role: 'role-a',
			admin_access: false,
			app_access: true,
		},
		{
			user: null,
			role: 'role-a',
			admin_access: true,
			app_access: false,
		},
		{
			user: null,
			role: 'role-b',
			admin_access: false,
			app_access: true,
		},
		{
			user: 'user-c',
			role: null,
			admin_access: true,
			app_access: false,
		},
		{
			user: null,
			role: 'role-d',
			admin_access: false,
			app_access: false,
		},
		{
			user: null,
			role: 'role-e',
			admin_access: false,
			app_access: false,
		},
	]);

	vi.mocked(fetchActiveUsers).mockResolvedValue([
		{
			id: 'user-a',
			role: 'role-a',
		},
		{
			id: 'user-b',
			role: 'role-b',
		},
		{
			id: 'user-c', // User C has admin directly attached
			role: 'role-b',
		},
		{
			id: 'user-d',
			role: null,
		},
		{
			id: 'user-e',
			role: 'role-e',
		},
	]);

	vi.mocked(fetchRolesTree).mockImplementation(async (start, _) => {
		switch (start) {
			case 'role-a':
				return ['role-a'];
			case 'role-b':
				return ['role-b'];
			case 'role-c':
				return ['role-c'];
			case 'role-d':
				return ['role-d'];
			case 'role-e':
				return ['role-e', 'role-b'];
			case null:
				return [];
			default:
				return [start];
		}
	});

	const counts = await fetchUserCount({ knex });

	/**
	 * Role A has 3 definitions. One of them contains admin, so users in A are counted as admin
	 * Role B has just app access. The second user in role B has admin access directly attached
	 * Role C has admin access, no users directly attached, but has a child role E
	 * Role D has no access, and no users
	 * Role E has one user, and Role B as parent user (so is counted as app)
	 * There is one user with no role which should be counted as api only
	 */
	expect(counts).toEqual({
		admin: 2,
		app: 2,
		api: 1,
	});
});
