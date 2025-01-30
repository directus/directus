import type { Accountability, PermissionsAction } from '@directus/types';
import { difference, intersection, uniq } from 'lodash-es';
import { fetchPermissions } from '../../lib/fetch-permissions.js';
import { fetchPolicies } from '../../lib/fetch-policies.js';
import type { Context } from '../../types.js';
import { useCache } from '../../cache.js';

export type FieldMap = Record<string, string[]>;
export type FieldMapsResult = { allowed: FieldMap; inconsistent: FieldMap };

export interface FetchFieldMapsOptions {
	accountability: Pick<Accountability, 'user' | 'role' | 'roles' | 'ip' | 'admin' | 'app'> | null;
	action: PermissionsAction;
	fieldMapTypes: ('allowed' | 'inconsistent')[];
}

export async function fetchFieldMaps(options: FetchFieldMapsOptions, context: Context) {
	const cache = useCache();

	const key = `fields_map_${options.accountability?.role}_${options.accountability?.user}_${
		options.action
	}_${options.fieldMapTypes.join('_')}`;

	let cachedFieldMaps = await cache.get<FieldMapsResult>(key);

	if (cachedFieldMaps) return cachedFieldMaps;

	// Check if an alternate cache is available
	if (options.fieldMapTypes.length > 1) {
		cachedFieldMaps = await cache.get<FieldMapsResult>(
			`fields_map_${options.accountability?.role}_${options.accountability?.user}_${options.action}_allowed_inconsistent`,
		);

		if (cachedFieldMaps) return cachedFieldMaps;
	}

	const fieldMaps = await _fetchFieldMaps(options, context);

	await cache.set(key, fieldMaps);

	return fieldMaps;
}

export async function _fetchFieldMaps(
	{ accountability, action, fieldMapTypes = ['allowed'] }: FetchFieldMapsOptions,
	{ knex, schema }: Context,
) {
	const fieldMaps: FieldMapsResult = {
		allowed: {},
		inconsistent: {},
	};

	if (!accountability || accountability.admin) {
		for (const [collection, { fields }] of Object.entries(schema.collections)) {
			if (fieldMapTypes.includes('allowed')) {
				fieldMaps.allowed[collection] = Object.keys(fields);
			}

			if (fieldMapTypes.includes('inconsistent')) {
				fieldMaps.inconsistent[collection] = [];
			}
		}

		return fieldMaps;
	}

	const policies = await fetchPolicies(accountability, { knex, schema });
	const permissions = await fetchPermissions({ action, policies, accountability }, { knex, schema });

	for (const { collection, fields } of permissions) {
		if (fieldMapTypes.includes('allowed')) {
			if (!fieldMaps.allowed[collection]) {
				fieldMaps.allowed[collection] = [];
			}

			if (fields) {
				fieldMaps.allowed[collection]!.push(...fields);
			}
		}

		if (fieldMapTypes.includes('inconsistent') && !fieldMaps.inconsistent[collection]) {
			const fields: string[][] = permissions
				.filter((permission) => permission.collection === collection)
				.map((permission) => permission.fields ?? []);

			const availableEverywhere = intersection(...fields);
			const availableSomewhere = difference(uniq(fields.flat()), availableEverywhere);

			fieldMaps.inconsistent[collection] = availableSomewhere;
		}
	}

	if (fieldMapTypes.includes('allowed')) {
		for (const [collection, fields] of Object.entries(fieldMaps.allowed)) {
			fieldMaps.allowed[collection] = uniq(fields);
		}
	}

	return fieldMaps;
}
