import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';

/**
 * Fetches the global access permissions for a specific user.
 *
 * @param user - The user ID
 * @param context
 * @returns - The global access permissions for the user
 */
export async function fetchGlobalAccessForUser(
	user: Accountability['user'],
	context: {
		knex: Knex;
		ip?: Accountability['ip'];
	},
): Promise<GlobalAccess> {
	const query = context.knex.where('user', '=', user);
	return await fetchGlobalAccessForQuery(query, { ip: context.ip ?? null });
}
