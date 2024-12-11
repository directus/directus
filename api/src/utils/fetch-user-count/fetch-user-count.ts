import { toBoolean } from '@directus/utils';
import { fetchAccessLookup, type FetchAccessLookupOptions } from './fetch-access-lookup.js';
import { fetchAccessRoles } from './fetch-access-roles.js';
import { getUserCountQuery } from './get-user-count-query.js';

export type FetchUserCountOptions = FetchAccessLookupOptions;

export interface UserCount {
	admin: number;
	app: number;
	api: number;
}

/**
 * Returns counts of all active users in the system grouped by admin, app, and api access
 */
export async function fetchUserCount(options: FetchUserCountOptions): Promise<UserCount> {
	const accessRows = await fetchAccessLookup(options);

	const adminRoles = new Set(
		accessRows.filter((row) => toBoolean(row.admin_access) && row.role !== null).map((row) => row.role!),
	);

	const appRoles = new Set(
		accessRows
			.filter((row) => !toBoolean(row.admin_access) && toBoolean(row.app_access) && row.role !== null)
			.map((row) => row.role!),
	);

	// All users that are directly granted rights through a connected policy
	const adminUsers = new Set(
		accessRows
			.filter((row) => toBoolean(row.admin_access) && row.user !== null && row.user_status === 'active')
			.map((row) => row.user!),
	);

	// Some roles might be granted access rights through nesting, so determine all roles that grant admin or app access,
	// including nested roles
	const { adminRoles: allAdminRoles, appRoles: allAppRoles } = await fetchAccessRoles(
		{
			adminRoles,
			appRoles,
			...options,
		},
		{ knex: options.knex },
	);

	// All users that are granted admin rights through a role, but not directly
	const adminCountQuery = getUserCountQuery(options.knex, {
		includeRoles: Array.from(allAdminRoles),
		excludeIds: [...adminUsers, ...(options.excludeUsers ?? [])],
	});

	if (options.adminOnly) {
		// Shortcut for only counting admin users

		const adminResult = await adminCountQuery;

		return {
			admin: Number(adminResult?.['count'] ?? 0) + adminUsers.size,
			app: 0,
			api: 0,
		};
	}

	const appUsers = new Set(
		accessRows
			.filter(
				(row) =>
					!toBoolean(row.admin_access) &&
					toBoolean(row.app_access) &&
					row.user !== null &&
					row.user_status === 'active' &&
					adminUsers.has(row.user) === false &&
					adminRoles.has(row.user_role as any) === false,
			)
			.map((row) => row.user!),
	);

	// All users that are granted app rights through a role, but not directly, and that aren't admin users
	const appCountQuery = getUserCountQuery(options.knex, {
		includeRoles: Array.from(allAppRoles),
		excludeRoles: Array.from(allAdminRoles),
		excludeIds: [...appUsers, ...adminUsers, ...(options.excludeUsers ?? [])],
	});

	const allCountQuery = getUserCountQuery(options.knex, {
		excludeIds: options.excludeUsers ?? [],
	});

	const [adminResult, appResult, allResult] = await Promise.all([adminCountQuery, appCountQuery, allCountQuery]);

	const adminCount = Number(adminResult?.['count'] ?? 0) + adminUsers.size;
	const appCount = Number(appResult?.['count'] ?? 0) + appUsers.size;

	return {
		admin: adminCount,
		app: appCount,
		api: Math.max(0, Number(allResult?.['count'] ?? 0) - adminCount - appCount),
	};
}
