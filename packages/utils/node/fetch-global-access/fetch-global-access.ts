import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForRoles } from './lib/fetch-global-access-for-roles.js';
import { fetchGlobalAccessForUser } from './lib/fetch-global-access-for-user.js';

interface FetchGlobalAccessContext {
	knex: Knex;
}

/**
 * Fetch the global access (eg admin/app access) rules for the given roles, or roles+user combination
 *
 * Will fetch roles and user info separately so they can be cached and reused individually
 */
export async function fetchGlobalAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: FetchGlobalAccessContext,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability, { knex: context.knex });

	if (accountability.user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(accountability, { knex: context.knex });

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
