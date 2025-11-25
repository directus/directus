import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

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
