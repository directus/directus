import type { Knex } from 'knex';
import { fetchGlobalAccessForRoles } from './lib/fetch-global-access-for-roles.js';
import { fetchGlobalAccessForUser } from './lib/fetch-global-access-for-user.js';
import type { GlobalAccess } from './types.js';

/**
 * Fetch the global access (eg admin/app access) rules for the given roles, or roles+user combination
 *
 * Will fetch roles and user info separately so they can be cached and reused individually
 */
export async function fetchGlobalAccess(knex: Knex, roles: string[], user?: string): Promise<GlobalAccess> {
	let { app, admin } = await fetchGlobalAccessForRoles(knex, roles);

	if (user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(knex, user);

		// If app/admin is already true, keep it true
		app = app || userAccess.app;
		admin = admin || userAccess.admin;
	}

	return { app, admin };
}
