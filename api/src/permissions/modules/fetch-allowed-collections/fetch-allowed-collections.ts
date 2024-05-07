import type { Accountability, PermissionsAction, SchemaOverview } from '@directus/types';
import { uniq } from 'lodash-es';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/index.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import { withCache } from '../../utils/with-cache.js';

export interface FetchAllowedCollectionsOptions {
	action: PermissionsAction;
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip' | 'admin'>;
}

export interface FetchAllowedCollectionsContext {
	accessService: AccessService;
	permissionsService: PermissionsService;
	schema: SchemaOverview;
}

export const fetchAllowedCollections = withCache('allowed-collections', _fetchAllowedCollections);

export async function _fetchAllowedCollections(
	options: FetchAllowedCollectionsOptions,
	context: FetchAllowedCollectionsContext,
): Promise<string[]> {
	if (options.accountability.admin) {
		return Object.keys(context.schema.collections);
	}

	const policies = await fetchPolicies(options.accountability, context.accessService);

	const permissions = (await context.permissionsService.readByQuery({
		fields: ['collection'],
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: options.action } }],
		},
		limit: -1,
	})) as { collection: string }[];

	const collections = permissions.map(({ collection }) => collection);

	return uniq(collections);
}
