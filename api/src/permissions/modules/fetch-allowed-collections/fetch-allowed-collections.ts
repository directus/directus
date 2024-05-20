import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';
import { PermissionsService } from '../../../services/permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { withCache } from '../../utils/with-cache.js';

export interface FetchAllowedCollectionsOptions {
	action: PermissionsAction;
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip' | 'admin'>;
}

export const fetchAllowedCollections = withCache('allowed-collections', _fetchAllowedCollections);

export async function _fetchAllowedCollections(
	options: FetchAllowedCollectionsOptions,
	context: Context,
): Promise<string[]> {
	if (options.accountability.admin) {
		return Object.keys(context.schema.collections);
	}

	const permissionsService = new PermissionsService(context);

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = (await permissionsService.readByQuery({
		fields: ['collection'],
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: options.action } }],
		},
		limit: -1,
	})) as { collection: string }[];

	const collections = permissions.map(({ collection }) => collection);

	return uniq(collections);
}
