import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import { withCache } from '../../../utils/with-cache.js';
import type { GlobalAccess } from '../types.js';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

export const fetchGlobalAccessForRoles = withCache(
	'global-access-role',
	_fetchGlobalAccessForRoles,
	({ roles, ip }) => ({ roles, ip }),
);

export async function _fetchGlobalAccessForRoles(
	accountability: Pick<Accountability, 'roles' | 'ip'>,
	knex: Knex,
): Promise<GlobalAccess> {
	const query = knex.where('role', 'in', accountability.roles);
	return await fetchGlobalAccessForQuery(query, accountability);
}
