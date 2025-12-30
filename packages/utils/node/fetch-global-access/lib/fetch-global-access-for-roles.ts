import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';

/**
 * Fetches the global access permissions for specific roles.
 *
 * @param roles  - The array of role IDs
 * @param context
 * @returns - The global access permissions for the roles
 */
export async function fetchGlobalAccessForRoles(
	roles: Accountability['roles'],
	context: {
		knex: Knex;
		ip?: Accountability['ip'];
	},
): Promise<GlobalAccess> {
	const query = context.knex.where('role', 'in', roles);
	return await fetchGlobalAccessForQuery(query, { ip: context.ip ?? null });
}
