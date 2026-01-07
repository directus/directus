import type { Accountability, PermissionsAction } from '@directus/types';
import { difference, intersection, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';

export type FieldMap = Record<string, string[]>;

export interface FetchInconsistentFieldMapOptions {
	accountability: Pick<Accountability, 'user' | 'role' | 'roles' | 'ip' | 'admin' | 'app'> | null;
	action: PermissionsAction;
}

/**
 * Fetch a field map for fields that may or may not be null based on item-by-item permissions.
 */
export async function fetchInconsistentFieldMap(
	{ accountability, action }: FetchInconsistentFieldMapOptions,
	{ knex, schema }: Context,
) {
	const fieldMap: FieldMap = {};

	if (!accountability || accountability.admin) {
		for (const collection of Object.keys(schema.collections)) {
			fieldMap[collection] = [];
		}

		return fieldMap;
	}

	const policies = await fetchPolicies(accountability, { knex, schema });
	const permissions = await fetchPermissions({ action, policies, accountability }, { knex, schema });

	const collections = uniq(permissions.map(({ collection }) => collection));

	for (const collection of collections) {
		const fields: string[][] = permissions
			.filter((permission) => permission.collection === collection)
			.map((permission) => permission.fields ?? []);

		const availableEverywhere = intersection(...fields);
		const availableSomewhere = difference(uniq(fields.flat()), availableEverywhere);

		fieldMap[collection] = availableSomewhere;
	}

	return fieldMap;
}
