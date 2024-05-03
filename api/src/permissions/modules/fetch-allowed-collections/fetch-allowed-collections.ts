import type { Accountability, PermissionsAction, SchemaOverview } from '@directus/types';
import { uniq } from 'lodash-es';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/index.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';

export async function fetchAllowedCollections(
	accessService: AccessService,
	permissionsService: PermissionsService,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
): Promise<string[]> {
	// TODO add cache

	if (accountability.admin) {
		return Object.keys(schema.collections);
	}

	const policies = await fetchPolicies(accessService, accountability);

	const permissions = (await permissionsService.readByQuery({
		fields: ['collection'],
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: action } }],
		},
		limit: -1,
	})) as { collection: string }[];

	const collections = permissions.map(({ collection }) => collection);

	return uniq(collections);
}
