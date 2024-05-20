import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';
import { PermissionsService } from '../../../services/permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { withCache } from '../../utils/with-cache.js';

export interface FetchAllowedFieldsOptions {
	collection: string;
	action: PermissionsAction;
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip'>;
}

export const fetchAllowedFields = withCache('allowed-fields', _fetchAllowedFields);

/**
 * Look up all fields that are allowed to be used for the given collection and action for the given
 * accountability object
 *
 * Done by looking up all available policies for the current accountability object, and reading all
 * permissions that exist for the collection+action+policy combination
 */
export async function _fetchAllowedFields(options: FetchAllowedFieldsOptions, context: Context): Promise<string[]> {
	const permissionsService = new PermissionsService(context);

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = (await permissionsService.readByQuery({
		fields: ['fields'],
		filter: {
			_and: [
				{ policy: { _in: policies } },
				{ collection: { _eq: options.collection } },
				{ action: { _eq: options.action } },
			],
		},
		limit: -1,
	})) as { fields: string[] | null }[];

	const allowedFields = [];

	for (const { fields } of permissions) {
		if (!fields) continue;
		allowedFields.push(...fields);
	}

	return uniq(allowedFields);
}
