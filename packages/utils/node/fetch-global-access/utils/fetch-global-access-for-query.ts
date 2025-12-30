import { toArray, toBoolean } from '../../../shared/index.js';
import { ipInNetworks } from '../../ip-in-networks.js';
import type { Accountability, GlobalAccess, Policy } from '@directus/types';
import type { Knex } from 'knex';

type AccessRow = {
	admin_access: Policy['admin_access'] | null;
	app_access: Policy['app_access'] | null;
	ip_access: Policy['ip_access'] | string | null;
};

export async function fetchGlobalAccessForQuery(
	query: Knex.QueryBuilder<any, any[]>,
	accountability: Pick<Accountability, 'ip'>,
): Promise<GlobalAccess> {
	const globalAccess = {
		app: false,
		admin: false,
	};

	const accessRows = await query
		.select<AccessRow[]>(
			'directus_policies.admin_access',
			'directus_policies.app_access',
			'directus_policies.ip_access',
		)
		.from('directus_access')
		// @NOTE: `where` clause comes from the caller
		.leftJoin('directus_policies', 'directus_policies.id', 'directus_access.policy');

	// Additively merge access permissions
	for (const { admin_access, app_access, ip_access } of accessRows) {
		if (accountability.ip && ip_access) {
			// Skip row if IP is not in the allowed networks
			const networks = toArray(ip_access);
			if (!ipInNetworks(accountability.ip, networks)) continue;
		}

		globalAccess.admin ||= toBoolean(admin_access);
		globalAccess.app ||= globalAccess.admin || toBoolean(app_access);
		if (globalAccess.admin) break;
	}

	return globalAccess;
}
