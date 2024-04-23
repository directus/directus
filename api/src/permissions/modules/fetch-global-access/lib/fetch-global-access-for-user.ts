import type { Knex } from 'knex';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';
import { getGlobalAccessUserCacheKey } from '../utils/get-global-access-user-cache-key.js';

export async function fetchGlobalAccessForUser(knex: Knex, user: string): Promise<GlobalAccess> {
	const userKey = getGlobalAccessUserCacheKey(user);
	const query = knex.where('user', 'eq', user);
	return await fetchGlobalAccessForQuery(query, userKey);
}
