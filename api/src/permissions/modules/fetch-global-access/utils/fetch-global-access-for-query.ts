import type { Knex } from 'knex';
import { useCache } from '../../../cache.js';
import type { GlobalAccess } from '../types.js';

export async function fetchGlobalAccessForQuery(
	query: Knex.QueryBuilder<any, any[]>,
	cacheKey: string,
): Promise<GlobalAccess> {
	const cache = useCache();

	const cached = await cache.get<GlobalAccess>(cacheKey);

	if (cached) {
		return cached;
	}

	let app = false;
	let admin = false;

	const access = await query
		.select('directus_policies.admin_access', 'directus_policies.app_access')
		.from('directus_access')
		.leftJoin('directus_policies', 'directus_policies.id', 'directus_access.policy');

	/**
	 * TODO filter down by IP address
	 */

	for (const { admin_access, app_access } of access) {
		if (app === false && (app_access === true || app_access === 1)) {
			app = true;
		}

		if (admin === false && (admin_access === true || admin_access === 1)) {
			app = true;
			admin = true;
		}
	}

	await cache.set(cacheKey, { app, admin });

	return { app, admin };
}
