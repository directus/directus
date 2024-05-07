import { processChunk, toBoolean } from '@directus/utils';
import { type Knex } from 'knex';
import { fetchRolesTree } from '../../permissions/lib/fetch-roles-tree.js';
import { fetchAccessLookup } from './fetch-access-lookup.js';
import { fetchActiveUsers } from './fetch-active-users.js';

export interface UserCount {
	admin: number;
	app: number;
	api: number;
}

/**
 * Returns counts of all active users in the system grouped by admin, app, and api access
 */
export const fetchUserCount = async (knex: Knex): Promise<UserCount> => {
	const counts: UserCount = {
		admin: 0,
		app: 0,
		api: 0,
	};

	const accessRows = await fetchAccessLookup(knex);

	const adminRoles = accessRows
		.filter((row) => toBoolean(row.admin_access) && row.role !== null)
		.map((row) => row.role!);

	const appRoles = accessRows.filter((row) => toBoolean(row.app_access) && row.role !== null).map((row) => row.role!);

	// All users that are directly granted rights through a connected policy
	const adminUsers = accessRows
		.filter((row) => toBoolean(row.admin_access) && row.user !== null)
		.map((row) => row.user!);

	const appUsers = accessRows.filter((row) => toBoolean(row.app_access) && row.user !== null).map((row) => row.user!);

	const activeUsers = await fetchActiveUsers(knex);

	await processChunk(activeUsers, 50, async (users) => {
		const rolesForUsers = await Promise.all(
			users.map(async ({ role }) => {
				return await fetchRolesTree(role, knex);
			}),
		);

		for (const [index, roles] of rolesForUsers.entries()) {
			const user = users[index]!;

			if (roles.some((role) => adminRoles.includes(role)) || adminUsers.includes(user.id)) {
				counts.admin++;
				continue;
			}

			if (roles.some((role) => appRoles.includes(role)) || appUsers.includes(user.id)) {
				counts.app++;
				continue;
			}

			counts.api++;
		}
	});

	return counts;
};
