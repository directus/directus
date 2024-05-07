import { getSimpleHash } from '@directus/utils';
import type { Knex } from 'knex';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

export async function fetchGlobalAccessForRoles(knex: Knex, roles: string[]): Promise<GlobalAccess> {
	const query = knex.where('role', 'in', roles);
	return await fetchGlobalAccessForQuery(query, `global-access-roles-${getSimpleHash(JSON.stringify(roles))}`);
}
