import type { Accountability, PermissionsAction, SchemaOverview } from '@directus/types';
import { uniq } from 'lodash-es';
import { AccessService } from '../../../services/access.js';
import { PermissionsService } from '../../../services/index.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';

export type FieldMap = Record<string, string[]>;

export async function fetchAllowedFieldMap(
	accessService: AccessService,
	permissionsService: PermissionsService,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
) {
	// TODO add cache

	const fieldMap: FieldMap = {};

	if (accountability.admin) {
		for (const [collection, { fields }] of Object.entries(schema.collections)) {
			fieldMap[collection] = Object.keys(fields);
		}

		return fieldMap;
	}

	const policies = await fetchPolicies(accessService, accountability);

	const permissions = (await permissionsService.readByQuery({
		fields: ['collection', 'fields'],
		filter: {
			_and: [{ policy: { _in: policies } }, { action: { _eq: action } }],
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
