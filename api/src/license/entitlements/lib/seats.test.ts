import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UsersService } from '../../../services/index.js';
import { getActiveSeats, getSeatUsersAndRoles, resolveSeats } from './seats.js';

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../utils/fetch-user-count/fetch-access-roles.js', () => ({
	fetchAccessRoles: vi.fn(async ({ adminRoles, appRoles }) => ({ adminRoles, appRoles })),
}));

vi.mock('../../../services/index.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	const { mockUsersService } = await import('../../../test-utils/services/users-service.js');
	return { AccessService: mockItemsService().ItemsService, ...mockUsersService() };
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getSeatUsersAndRoles', () => {
	test('groups seat users and roles by access level', () => {
		expect(
			getSeatUsersAndRoles([
				{ user: { id: 'admin-1', status: 'active' }, policy: { admin_access: true } },
				{ user: { id: 'app-1', status: 'active' }, policy: { app_access: true } },
				{ role: 'role-admin', policy: { admin_access: true } },
				{ role: 'role-app', policy: { app_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(['admin-1']),
			appUsers: new Set(['app-1']),
			adminRoles: new Set(['role-admin']),
			appRoles: new Set(['role-app']),
		});
	});

	test('admin access directly on a user counts as a seat user', () => {
		expect(getSeatUsersAndRoles([{ user: { id: 'u1', status: 'active' }, policy: { admin_access: true } }])).toEqual({
			adminUsers: new Set(['u1']),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('admin access directly on a role counts as a seat role', () => {
		expect(getSeatUsersAndRoles([{ role: 'role-admin', policy: { admin_access: true } }])).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(['role-admin']),
			appRoles: new Set(),
		});
	});

	test('admin access user granted both admin and app access counts as admin', () => {
		expect(
			getSeatUsersAndRoles([
				{ user: { id: 'dual', status: 'active' }, policy: { admin_access: true } },
				{ user: { id: 'dual', status: 'active' }, policy: { app_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(['dual']),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('admin access user first marked as app and then admin counts as admin', () => {
		expect(
			getSeatUsersAndRoles([
				{ user: { id: 'dual', status: 'active' }, policy: { app_access: true } },
				{ user: { id: 'dual', status: 'active' }, policy: { admin_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(['dual']),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('app access user with admin role is excluded from app users', () => {
		expect(
			getSeatUsersAndRoles([
				{ role: 'role-admin', policy: { admin_access: true } },
				{ user: { id: 'u', status: 'active', role: 'role-admin' }, policy: { app_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(['role-admin']),
			appRoles: new Set(),
		});
	});

	test('app access user with an admin role is excluded from app users regardless of row order', () => {
		expect(
			getSeatUsersAndRoles([
				{ user: { id: 'u', status: 'active', role: 'role-admin' }, policy: { app_access: true } },
				{ role: 'role-admin', policy: { admin_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(['role-admin']),
			appRoles: new Set(),
		});
	});

	test('access row with an inactive user is not added', () => {
		expect(
			getSeatUsersAndRoles([{ user: { id: 'inactive', status: 'inactive' }, policy: { admin_access: true } }]),
		).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('rows granting neither admin nor app access are ignored', () => {
		expect(getSeatUsersAndRoles([{ user: { id: 'no-access', status: 'active' }, policy: {} }])).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('rows with a missing policy are ignored', () => {
		expect(getSeatUsersAndRoles([{ user: { id: 'no-policy', status: 'active' } }])).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});

	test('multiple app users sharing a non-admin role are all tracked as app users', () => {
		expect(
			getSeatUsersAndRoles([
				{ user: { id: 'u1', status: 'active', role: 'role-app' }, policy: { app_access: true } },
				{ user: { id: 'u2', status: 'active', role: 'role-app' }, policy: { app_access: true } },
			]),
		).toEqual({
			adminUsers: new Set(),
			appUsers: new Set(['u1', 'u2']),
			adminRoles: new Set(),
			appRoles: new Set(),
		});
	});
});

describe('getActiveSeats', () => {
	test('returns admin candidates with admin:true', async () => {
		vi.mocked(UsersService.prototype.readByQuery)
			.mockResolvedValueOnce([{ id: 'admin1' }])
			.mockResolvedValueOnce([{ id: 'app1' }]);

		await expect(getActiveSeats()).resolves.toEqual([{ id: 'app1' }, { id: 'admin1', admin: true }]);
	});

	test('excludes acting admin from both candidate queries when adminId is provided', async () => {
		vi.mocked(UsersService.prototype.readByQuery).mockResolvedValue([]);

		await getActiveSeats({ adminId: 'self' });

		expect(UsersService.prototype.readByQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: expect.objectContaining({ _and: expect.arrayContaining([{ id: { _neq: 'self' } }]) }),
			}),
		);

		expect(UsersService.prototype.readByQuery).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: expect.objectContaining({ _and: expect.arrayContaining([{ id: { _neq: 'self' } }]) }),
			}),
		);
	});
});

describe('resolveSeats', () => {
	test('deactivates every given user except the acting user', async () => {
		await resolveSeats(['user1', 'admin', 'user2'], { accountability: { user: 'admin' } as any });

		const updateOne = vi.mocked(UsersService.prototype.updateOne);
		expect(updateOne).toHaveBeenCalledWith('user1', { status: USER_INACTIVE_LICENSE_STATUS });
		expect(updateOne).toHaveBeenCalledWith('user2', { status: USER_INACTIVE_LICENSE_STATUS });
		expect(updateOne).not.toHaveBeenCalledWith('admin', expect.anything());
	});

	test('no-op when there is no acting user', async () => {
		await resolveSeats(['user1']);

		expect(UsersService.prototype.updateOne).not.toHaveBeenCalled();
	});
});
