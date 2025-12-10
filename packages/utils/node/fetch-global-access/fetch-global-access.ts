import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForRoles } from './lib/fetch-global-access-for-roles.js';
import { fetchGlobalAccessForUser } from './lib/fetch-global-access-for-user.js';

/**
 * Fetches the global access permissions for a given accountability.
 *
 * @param accountability - The accountability object containing user, roles, and optionally the IP.
 * @param context
 * @returns The global access permissions.
 */
export async function fetchGlobalAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: { knex: Knex },
	_invalidate: () => void,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability.roles, { knex: context.knex, ip: accountability.ip });

	if (accountability.user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(accountability.user, {
			knex: context.knex,
			ip: accountability.ip,
		});

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
