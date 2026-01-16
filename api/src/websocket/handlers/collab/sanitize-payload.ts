import type { Accountability, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { isEmpty } from 'lodash-es';
import { asyncDeepMapWithSchema, isDetailedUpdateSyntax } from '../../../utils/versioning/deep-map-with-schema.js';
import { verifyPermissions } from './verify-permissions.js';

/**
 * Filters a payload based on the recipient's read permissions.
 * Uses `allowedFields` for root collection if provided, otherwise fetches permissions.
 */
export async function sanitizePayload(
	collection: string,
	payload: Record<string, unknown>,
	ctx: { knex: Knex; schema: SchemaOverview; accountability: Accountability },
) {
	const { accountability, schema } = ctx;

	return await asyncDeepMapWithSchema(
		payload,
		async ([key, value], context) => {
			if (context.field.special.some((v) => v === 'conceal' || v === 'hash')) return;

			// Skip empty relation values
			if ((context.relationType === 'm2o' || context.relationType === 'a2o') && isEmpty(value)) return;

			// Filter empty items from O2M arrays
			if ((context.relationType === 'o2m' || context.relationType === 'o2a') && typeof value === 'object') {
				if (Array.isArray(value)) {
					value = (value as Array<unknown>).filter((v) => !isEmpty(v));
					if ((value as Array<unknown>).length === 0) return;
				} else if (isDetailedUpdateSyntax(value)) {
					const filtered = {
						create: value.create.filter((v) => !isEmpty(v)),
						update: value.update.filter((v) => !isEmpty(v)),
						delete: value.delete.filter((v) => !isEmpty(v)),
					};

					// Omit field if all operations are empty
					if (filtered.create.length === 0 && filtered.update.length === 0 && filtered.delete.length === 0) {
						return;
					}

					value = filtered;
				}
			}

			const primaryKey = (context.object[context.collection.primary] ?? null) as PrimaryKey | null;

			const allowedFields = await verifyPermissions(accountability, context.collection.collection, primaryKey, 'read');

			if (allowedFields.length === 0 || !allowedFields.includes('*') || !allowedFields.includes(String(key))) return;

			return [key, value];
		},
		{
			schema,
			collection,
		},
		{
			detailedUpdateSyntax: true,
			omitUnknownFields: true,
			mapPrimaryKeys: true,
		},
	);
}
