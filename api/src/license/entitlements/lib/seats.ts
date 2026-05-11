import type { LicensePendingResolutionLimitSeats } from '@directus/license';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { AccessService, UsersService } from '../../../services/index.js';
import { fetchAccessRoles } from '../../../utils/fetch-user-count/fetch-access-roles.js';
import { getSchema } from '../../../utils/get-schema.js';

export type SeatUser = {
	id: string;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
};

export async function getActiveSeats(opts?: { knex?: Knex | undefined }): Promise<LicensePendingResolutionLimitSeats['candidates']> {
	const schema = await getSchema();

	const accessService = new AccessService({ schema, knex: opts?.knex ?? getDatabase() });

	const accessRows = await accessService.readByQuery({
		fields: ['role', 'user.id', 'user.status', 'user.role', 'policy.app_access', 'policy.admin_access'],
		limit: -1,
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
		{ knex: opts?.knex ?? getDatabase() },
	);

	const usersService = new UsersService({ schema });

	const adminCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar'],
		filter: {
			_and: [
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
		limit: -1,
	});

	const appCandidates = await usersService.readByQuery({
		fields: ['id', 'first_name', 'last_name', 'avatar'],
		filter: {
			_and: [
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
		limit: -1,
	});

	return [...appCandidates, ...adminCandidates.map((admin) => ({ ...admin, admin: true }))] as any;
}

export async function countActiveSeats(opts?: { knex?: Knex | undefined }) {
	const seats = await getActiveSeats(opts);

	return seats.length;
}

export async function getSeatResolutionCandidates(ctx?: { adminId: string }) {

}

export async function resolveSeats(seats: string[], ctx?: { adminId: string }) {
	if (!ctx?.adminId) return;

	const usersService = new UsersService({ schema: await getSchema() });

	const users = seats.filter((user_id) => user_id !== ctx.adminId);

	await Promise.allSettled(
		users.map((user_id) => usersService.updateOne(user_id, { status: 'deactivated-license-exceeded' })),
	);
}
