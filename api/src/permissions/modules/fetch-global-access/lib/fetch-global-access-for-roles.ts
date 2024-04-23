import type { Knex } from 'knex';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { getGlobalAccessRolesCacheKey } from '../utils/get-global-access-roles-cache-key.js';

export async function fetchGlobalAccessForRoles(knex: Knex, roles: string[]): Promise<GlobalAccess> {
	const rolesKey = getGlobalAccessRolesCacheKey(roles);
	const query = knex.where('role', 'in', roles);
	return await fetchGlobalAccessForQuery(query, rolesKey);
}
