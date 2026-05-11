import type { LicensePendingResolutionLimitSeats } from '@directus/license';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { AccessService, UsersService } from '../../../services/index.js';
import { fetchAccessRoles } from '../../../utils/fetch-user-count/fetch-access-roles.js';
import { fetchUserCount } from '../../../utils/fetch-user-count/fetch-user-count.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveSeats(ctx?: {
	adminId: string;
}): Promise<LicensePendingResolutionLimitSeats['candidates'] | void> {
	// license-TODO refactor
	if (!ctx?.adminId) return;

	const schema = await getSchema();

	const accessService = new AccessService({ schema });

	const accessRows = await accessService.readByQuery({
		fields: ['role', 'user.id', 'user.status', 'user.role', 'policy.app_access', 'policy.admin_access'],
	});

	const adminRoles = new Set<string>();
	const appRoles = new Set<string>();
	const adminUsers = new Set<string>();
	const appUsers = new Set<string>();

	for (const accessRow of accessRows) {
		const isAdmin = toBoolean(accessRow['policy']?.['admin_access']);
		const isApp = !isAdmin && toBoolean(accessRow['policy']?.['app_access']);

		if (!isAdmin && !isApp) continue;

		if (accessRow['user'] && accessRow['user'].status === 'active') {
			if (isAdmin) {
				adminUsers.add(accessRow['user'].id);
			} else if (adminUsers.has(accessRow['user'].id) === false && adminRoles.has(accessRow['user']?.role) === false) {
				appUsers.add(accessRow['user'].id);
			}
		}

		if (accessRow['role']) {
			if (isAdmin) {
				adminRoles.add(accessRow['role']);
			} else {
				appRoles.add(accessRow['role']);
			}
		}
	}

	const { adminRoles: allAdminRoles, appRoles: allAppRoles } = await fetchAccessRoles(
		{
			adminRoles,
			appRoles,
		},
		{ knex: await getDatabase() },
	);

	const usersService = new UsersService({ schema });

	const adminCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar'],
		filter: {
			_and: [
				{
					id: {
						_neq: ctx.adminId,
					},
				},
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
			],
		},
	});

	const appCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar'],
		filter: {
			_and: [
				{
					id: {
						_neq: ctx.adminId,
					},
				},
				{
					_or: [
						{
							id: {
								_in: Array.from(appUsers),
								_nin: Array.from(adminUsers),
							},
						},
						{
							role: {
								_in: Array.from(allAppRoles),
								_nin: Array.from(allAdminRoles),
							},
						},
					],
				},
				{
					status: {
						_eq: 'active',
					},
				},
			],
		},
	});

	return [...appCandidates, ...adminCandidates.map((admin) => ({ ...admin, admin: true }))] as any;
}

export async function countActiveSeats(opts?: { knex?: Knex | undefined }) {
	const userCounts = await fetchUserCount({
		knex: opts?.knex ?? getDatabase(),
	});

	return userCounts.admin + userCounts.app;
}

export async function resolveSeats(seats: string[], ctx?: { adminId: string }) {
	if (!ctx?.adminId) return;

	const usersService = new UsersService({ schema: await getSchema() });

	const users = seats.filter((user_id) => user_id !== ctx.adminId);

	await Promise.allSettled(
		users.map((user_id) => usersService.updateOne(user_id, { status: 'inactive-license-exceeded' })),
	);
}
