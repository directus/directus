import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

interface FetchGlobalAccessForUserContext {
	knex: Knex;
}

export async function fetchGlobalAccessForUser(
	accountability: Pick<Accountability, 'user' | 'ip'>,
	context: FetchGlobalAccessForUserContext,
): Promise<GlobalAccess> {
	const query = context.knex.where('user', '=', accountability.user);
	return await fetchGlobalAccessForQuery(query, accountability);
}
