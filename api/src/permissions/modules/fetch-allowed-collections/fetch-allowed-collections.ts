import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

export interface FetchAllowedCollectionsOptions {
	action: PermissionsAction;
	accountability: Pick<Accountability, 'user' | 'role' | 'roles' | 'ip' | 'admin' | 'app'>;
}

export async function fetchAllowedCollections(
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
