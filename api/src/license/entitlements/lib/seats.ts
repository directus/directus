import { USER_INACTIVE_LICENSE_STATUS } from '@directus/constants';
import type { LicensePendingResolutionLimitSeats } from '@directus/license';
import type { Accountability, Filter } from '@directus/types';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { AccessService, UsersService } from '../../../services/index.js';
import { fetchAccessRoles } from '../../../utils/fetch-user-count/fetch-access-roles.js';
import { getSchema } from '../../../utils/get-schema.js';

/**
 * Group access rows to the admin/app users and roles that occupy a seat.
 */
export function getSeatUsersAndRoles(accessRows: Record<string, any>[]) {
	const adminRoles = new Set<string>();
	const appRoles = new Set<string>();
	const adminUsers = new Set<string>();
	const appUsers = new Set<string>();

	// Track app users who role may be marked as admin from later acess row
	const appUsersByRole = new Map<string, Set<string>>();

	for (const accessRow of accessRows) {
		const { admin_access, app_access } = accessRow['policy'] || {};

		const isAdmin = toBoolean(admin_access);
		const isApp = !isAdmin && toBoolean(app_access);

		if (!isAdmin && !isApp) continue;

		if (accessRow['user'] && accessRow['user'].status === 'active') {
			const { id, role } = accessRow['user'];

			if (isAdmin) {
				adminUsers.add(id);

				// remove if previously marked as app user from previous access/policy
				appUsers.delete(id);
			} else if (adminUsers.has(id) === false && (!role || adminRoles.has(role) === false)) {
				appUsers.add(id);

				if (role) {
					const roleUsers = appUsersByRole.get(role) ?? new Set<string>();

					appUsersByRole.set(role, roleUsers.add(id));
				}
			}
		}

		if (accessRow['role']) {
			if (isAdmin) {
				adminRoles.add(accessRow['role']);

				// remove any app user whose role was admin
				for (const id of appUsersByRole.get(accessRow['role']) ?? []) {
					appUsers.delete(id);
				}
			} else {
				appRoles.add(accessRow['role']);
			}
		}
	}

	return { adminUsers, appUsers, adminRoles, appRoles };
}

export async function getActiveSeats(opts?: {
	adminId?: string;
	knex?: Knex | undefined;
}): Promise<LicensePendingResolutionLimitSeats['candidates']> {
	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const accessService = new AccessService({ schema, knex });

	const accessRows = await accessService.readByQuery({
		fields: ['role', 'user.id', 'user.status', 'user.role', 'policy.app_access', 'policy.admin_access'],
		limit: -1,
	});

	const { adminUsers, appUsers, adminRoles, appRoles } = getSeatUsersAndRoles(accessRows);

	const { adminRoles: allAdminRoles, appRoles: allAppRoles } = await fetchAccessRoles(
		{
			adminRoles,
			appRoles,
		},
		{ knex },
	);

	const usersService = new UsersService({ schema, knex });

	const adminFilters: Filter[] = [
		{
			_or: [
				{
					id: {
						_in: Array.from(adminUsers),
					},
				},
				{
					role: {
						_in: Array.from(allAdminRoles),
					},
				},
			],
		},
		{
			status: {
				_eq: 'active',
			},
		},
	];

	const appFilters: Filter[] = [
		{
			_or: [
				{
					id: {
						_in: Array.from(appUsers),
					},
				},
				{
					role: {
						_in: Array.from(allAppRoles),
					},
				},
			],
		},
		{
			id: {
				_nin: Array.from(adminUsers),
			},
		},
		{
			_or: [
				{
					role: {
						_nin: Array.from(allAdminRoles),
					},
				},
				// Dont exclude users marked as app via direct policy
				{
					role: {
						_null: true,
					},
				},
			],
		},
		{
			status: {
				_eq: 'active',
			},
		},
	];

	if (opts?.adminId) {
		adminFilters.push({
			id: {
				_neq: opts.adminId,
			},
		});

		appFilters.push({
			id: {
				_neq: opts.adminId,
			},
		});
	}

	const adminCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar', 'email'],
		filter: {
			_and: adminFilters,
		},
		limit: -1,
	});

	const appCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar', 'email'],
		filter: {
			_and: appFilters,
		},
		limit: -1,
	});

	return [...appCandidates, ...adminCandidates.map((admin) => ({ ...admin, admin: true }))] as any;
}

export async function countActiveSeats(opts?: { knex?: Knex | undefined }) {
	const seats = await getActiveSeats(opts);

	return seats.length;
}

export async function resolveSeats(seats: string[], ctx?: { accountability?: Accountability | undefined }) {
	if (!ctx?.accountability?.user) return;

	const usersService = new UsersService({ schema: await getSchema(), accountability: ctx.accountability });

	const users = seats.filter((user_id) => user_id !== ctx.accountability!.user);

	await Promise.allSettled(
		users.map((user_id) => usersService.updateOne(user_id, { status: USER_INACTIVE_LICENSE_STATUS })),
	);
}
