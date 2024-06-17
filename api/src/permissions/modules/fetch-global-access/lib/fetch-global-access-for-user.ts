import type { Knex } from 'knex';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

export async function fetchGlobalAccessForUser(knex: Knex, user: string): Promise<GlobalAccess> {
	const query = knex.where('user', '=', user);
	return await fetchGlobalAccessForQuery(query, `global-access-user-${user}`);
}
