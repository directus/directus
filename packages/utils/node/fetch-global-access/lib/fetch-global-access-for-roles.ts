import type { Accountability, GlobalAccess } from '@directus/types';
import type { Knex } from 'knex';
import { fetchGlobalAccessForQuery } from '../utils/fetch-global-access-for-query.js';

interface FetchGlobalAccessForRolesContext {
	knex: Knex;
}

export async function fetchGlobalAccessForRoles(
	accountability: Pick<Accountability, 'roles' | 'ip'>,
	context: FetchGlobalAccessForRolesContext,
): Promise<GlobalAccess> {
	const query = context.knex.where('role', 'in', accountability.roles);
	return await fetchGlobalAccessForQuery(query, accountability);
}
