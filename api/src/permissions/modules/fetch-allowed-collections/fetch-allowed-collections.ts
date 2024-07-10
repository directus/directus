import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { withCache } from '../../utils/with-cache.js';
import { fetchPermissions } from '../../lib/fetch-permissions.js';

export interface FetchAllowedCollectionsOptions {
	action: PermissionsAction;
	accountability: Pick<Accountability, 'user' | 'role' | 'roles' | 'ip' | 'admin' | 'app'>;
}

export const fetchAllowedCollections = withCache(
	'allowed-collections',
	_fetchAllowedCollections,
	({ action, accountability: { user, role, roles, ip, admin, app } }) => ({
		action,
		accountability: {
			user,
			role,
			roles,
			ip,
			admin,
			app,
		},
	}),
);

export async function _fetchAllowedCollections(
	{ action, accountability }: FetchAllowedCollectionsOptions,
	{ knex, schema }: Context,
): Promise<string[]> {
	if (accountability.admin) {
		return Object.keys(schema.collections);
	}

	const policies = await fetchPolicies(accountability, { knex, schema });
	const permissions = await fetchPermissions({ action, policies, accountability }, { knex, schema });

	const collections = permissions.map(({ collection }) => collection);

	return uniq(collections);
}
