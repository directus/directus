import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';
import { PermissionsService } from '../../../services/index.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { withCache } from '../../utils/with-cache.js';

export type FieldMap = Record<string, string[]>;

export interface FetchAllowedFieldMapOptions {
	accountability: Pick<Accountability, 'user' | 'roles' | 'ip' | 'admin'>;
	action: PermissionsAction;
}

export const fetchAllowedFieldMap = withCache('allowed-field-map', _fetchAllowedFieldMap);

export async function _fetchAllowedFieldMap(options: FetchAllowedFieldMapOptions, context: Context) {
	const fieldMap: FieldMap = {};

	if (options.accountability.admin) {
		for (const [collection, { fields }] of Object.entries(context.schema.collections)) {
			fieldMap[collection] = Object.keys(fields);
		}

		return fieldMap;
	}

	const permissionsService = new PermissionsService(context);

	const policies = await fetchPolicies(options.accountability, context);

	const permissions = (await permissionsService.readByQuery({
		fields: ['collection', 'fields'],
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: options.action } }],
		},
		limit: -1,
	})) as { collection: string; fields: string[] }[];

	for (const { collection, fields } of permissions) {
		if (!fieldMap[collection]) {
			fieldMap[collection] = [];
		}

		fieldMap[collection]!.push(...fields);
	}

	for (const [collection, fields] of Object.entries(fieldMap)) {
		fieldMap[collection] = uniq(fields);
	}

	return fieldMap;
}
