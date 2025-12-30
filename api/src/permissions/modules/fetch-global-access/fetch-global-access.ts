import { withCache } from '../../utils/with-cache.js';
import type { Accountability, GlobalAccess } from '@directus/types';
import {
	fetchGlobalAccessForRoles as _fetchGlobalAccessForRoles,
	fetchGlobalAccessForUser as _fetchGlobalAccessForUser,
} from '@directus/utils/node';
import type { Knex } from 'knex';

interface FetchGlobalAccessContext {
	knex: Knex;
	ip?: Accountability['ip'];
}

export const fetchGlobalAccess = withCache('global-access', _fetchGlobalAccess, ({ user, roles }, { ip }) => ({
	user,
	roles,
	ip,
}));

const fetchGlobalAccessForRoles = withCache('global-access-roles', _fetchGlobalAccessForRoles, (roles, { ip }) => ({
	roles,
	ip,
}));

const fetchGlobalAccessForUser = withCache('global-access-user', _fetchGlobalAccessForUser, (user, { ip }) => ({
	user,
	ip,
}));

/**
 * Re-implements fetchGlobalAccess to add caching, fetches roles and user info separately so they can be cached and reused individually
 */
export async function _fetchGlobalAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: FetchGlobalAccessContext,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability.roles, { knex: context.knex, ip: accountability.ip });

	if (accountability.user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(accountability.user, {
			knex: context.knex,
			ip: accountability.ip,
		});

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
