import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

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
