import type { Accountability, Policy } from '@directus/types';
import { toArray, toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import type { Nullable } from 'vitest';
import { ipInNetworks } from '../../../../utils/ip-in-networks.js';
import { withCache } from '../../../utils/with-cache.js';
import type { GlobalAccess } from '../types.js';

export const fetchGlobalAccessForQuery = withCache('global-access-query', _fetchGlobalAccessForQuery);

type RowResult = {
	admin_access: Nullable<Policy['admin_access']>;
	app_access: Nullable<Policy['app_access']>;
	ip_access: Nullable<Policy['ip_access'] | string>;
};

export async function _fetchGlobalAccessForQuery(
	_cacheKey: string,
	query: Knex.QueryBuilder<any, any[]>,
	ip?: Accountability['ip'],
): Promise<GlobalAccess> {
	const accessRows = await query
		.select<RowResult[]>(
			'directus_policies.admin_access',
			'directus_policies.app_access',
			'directus_policies.ip_access',
		)
		.from('directus_access')
		// @NOTE: `where` clause comes from the caller
		.leftJoin('directus_policies', 'directus_policies.id', 'directus_access.policy');

	const globalAccess: GlobalAccess = {
		admin: false,
		app: false,
	};

	// Additively merge access permissions
	for (const { admin_access, app_access, ip_access } of accessRows) {
		// Only apply policies with matching ip access if warranted
		if (ip && ip_access) {
			const networks = toArray(ip_access);
			if (!ipInNetworks(ip, networks)) continue;
		}

		globalAccess.admin ||= toBoolean(admin_access);
		globalAccess.app ||= globalAccess.admin || toBoolean(app_access);
		if (globalAccess.admin) break;
	}

	return globalAccess;
}
