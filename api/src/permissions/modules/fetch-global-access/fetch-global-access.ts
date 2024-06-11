import type { Accountability } from '@directus/types';
import type { Context } from '../../types.js';
import { withCache } from '../../utils/with-cache.js';
import { fetchGlobalAccessForRoles } from './lib/fetch-global-access-for-roles.js';
import { fetchGlobalAccessForUser } from './lib/fetch-global-access-for-user.js';
import type { GlobalAccess } from './types.js';

export type FetchGlobalAccessOptions = {
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>;
};

export const fetchGlobalAccess = withCache('global-access', _fetchGlobalAccess);

/**
 * Fetch the global access (eg admin/app access) rules for the given roles, or roles+user combination
 *
 * Will fetch roles and user info separately so they can be cached and reused individually
 */
export async function _fetchGlobalAccess(
	{ accountability }: FetchGlobalAccessOptions,
	context: Pick<Context, 'knex'>,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability, { knex: context.knex });

	if (accountability.user) {
		const userAccess = await fetchGlobalAccessForUser(accountability, { knex: context.knex });

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
