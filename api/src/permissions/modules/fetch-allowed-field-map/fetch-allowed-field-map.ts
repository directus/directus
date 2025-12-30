import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import type { Accountability, PermissionsAction } from '@directus/types';
import { uniq } from 'lodash-es';

export type FieldMap = Record<string, string[]>;

export interface FetchAllowedFieldMapOptions {
	accountability: Pick<Accountability, 'user' | 'role' | 'roles' | 'ip' | 'admin' | 'app'>;
	action: PermissionsAction;
}

export async function fetchAllowedFieldMap(
	{ accountability, action }: FetchAllowedFieldMapOptions,
	{ knex, schema }: Context,
) {
	const fieldMap: FieldMap = {};

	if (accountability.admin) {
		for (const [collection, { fields }] of Object.entries(schema.collections)) {
			fieldMap[collection] = Object.keys(fields);
		}

		return fieldMap;
	}

	const policies = await fetchPolicies(accountability, { knex, schema });
	const permissions = await fetchPermissions({ action, policies, accountability }, { knex, schema });

	for (const { collection, fields } of permissions) {
		if (!fieldMap[collection]) {
			fieldMap[collection] = [];
		}

		if (fields) {
			fieldMap[collection]!.push(...fields);
		}
	}

	for (const [collection, fields] of Object.entries(fieldMap)) {
		fieldMap[collection] = uniq(fields);
	}

	return fieldMap;
}
