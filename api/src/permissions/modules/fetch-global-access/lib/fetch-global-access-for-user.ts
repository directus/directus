import type { Accountability } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import type { Context } from '../../../types.js';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

export async function fetchGlobalAccessForUser(
	accountability: Pick<Accountability, 'user' | 'ip'>,
	context: Pick<Context, 'knex'>,
): Promise<GlobalAccess> {
	const query = context.knex.where('user', '=', accountability.user);
	return await fetchGlobalAccessForQuery(
		getSimpleHash(`${accountability.user}-${accountability.ip}`), // Hash it so we dont expose user IPs
		query,
		accountability.ip,
	);
}
