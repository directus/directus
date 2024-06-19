import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { withCache } from '../../../utils/with-cache.js';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

export const fetchGlobalAccessForUser = withCache('global-access-user', _fetchGlobalAccessForUser, ({ user, ip }) => ({
	user,
	ip,
}));

export async function _fetchGlobalAccessForUser(
	accountability: Pick<Accountability, 'user' | 'ip'>,
	knex: Knex,
): Promise<GlobalAccess> {
	const query = knex.where('user', '=', accountability.user);
	return await fetchGlobalAccessForQuery(query, accountability);
}
