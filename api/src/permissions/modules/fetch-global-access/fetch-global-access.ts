import type { Accountability, GlobalAccess } from '@directus/types';
import {
	fetchGlobalAccessForRoles as _fetchGlobalAccessForRoles,
	fetchGlobalAccessForUser as _fetchGlobalAccessForUser,
} from '@directus/utils/node';
import type { Knex } from 'knex';
import { withCache } from '../../utils/with-cache.js';

interface FetchGlobalAccessContext {
	knex: Knex;
}

export const fetchGlobalAccess = withCache('global-access', _fetchGlobalAccess, ({ user, roles, ip }) => ({
	user,
	roles,
	ip,
}));

const fetchGlobalAccessForRoles = withCache('global-access-roles', _fetchGlobalAccessForRoles, ({ roles, ip }) => ({
	roles,
	ip,
}));

const fetchGlobalAccessForUser = withCache('global-access-user', _fetchGlobalAccessForUser, ({ user, ip }) => ({
	user,
	ip,
}));

/**
 * Re-implements fetchGlobalAccess to add caching.
 */
export async function _fetchGlobalAccess(
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>,
	context: FetchGlobalAccessContext,
): Promise<GlobalAccess> {
	const access = await fetchGlobalAccessForRoles(accountability, { knex: context.knex });

	if (accountability.user !== undefined) {
		const userAccess = await fetchGlobalAccessForUser(accountability, { knex: context.knex });

		// If app/admin is already true, keep it true
		access.app ||= userAccess.app;
		access.admin ||= userAccess.admin;
	}

	return access;
}
