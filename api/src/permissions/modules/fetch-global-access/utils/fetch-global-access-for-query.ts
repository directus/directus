import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import type { AccessLookup } from '../../../../utils/fetch-user-count/fetch-access-lookup.js';
import { useCache } from '../../../cache.js';
import type { GlobalAccess } from '../types.js';

export async function fetchGlobalAccessForQuery(
	query: Knex.QueryBuilder<any, any[]>,
	cacheKey: string,
): Promise<GlobalAccess> {
	const cache = useCache();

	let globalAccess = await cache.get<GlobalAccess>(cacheKey);

	if (globalAccess) {
		return globalAccess;
	} else {
		globalAccess = {
			app: false,
			admin: false,
		};
	}

	const accessRows = await query
		.select<Pick<AccessLookup, 'admin_access' | 'app_access'>[]>(
			'directus_policies.admin_access',
			'directus_policies.app_access',
		)
		.from('directus_access')
		// @NOTE: `where` clause comes from the caller
		.leftJoin('directus_policies', 'directus_policies.id', 'directus_access.policy');

	/**
	 * TODO filter down by IP address
	 */

	// Additively merge access permissions
	for (const { admin_access, app_access } of accessRows) {
		globalAccess.admin ||= toBoolean(admin_access);
		globalAccess.app ||= globalAccess.admin || toBoolean(app_access);
		if (globalAccess.admin) break;
	}

	await cache.set(cacheKey, globalAccess);

	return globalAccess;
}
