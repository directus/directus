import type { Accountability, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { deepMapWithSchema, isDetailedUpdateSyntax } from '../../../utils/versioning/deep-map-with-schema.js';
import { verifyPermissions } from './verify-permissions.js';

/**
 * Sanitizes a payload based on the recipient's read permissions and the collection schema.
 * Supports nested relations and detailed update syntax.
 */
export async function sanitizePayload(
	payload: any,
	collection: string,
	context: {
		knex: Knex;
		schema: SchemaOverview;
		accountability: Accountability | null;
	},
) {
	const { accountability, schema, knex } = context;

	return await deepMapWithSchema(
		payload,
		async ([key, value], context) => {
			// Strip sensitive fields
			if (context.field?.special?.some((v) => v === 'conceal' || v === 'hash')) {
				return undefined;
			}

			// Strip unknown leaf fields that are not in the schema
			if (context.leaf && !context.relation && !context.field) {
				return undefined;
			}

			if (value === undefined) return undefined;

			// Check parent field permission for all fields
			const primaryKey = (context.object[context.collection.primary] ?? null) as PrimaryKey | null;

			let allowedFields = await verifyPermissions(accountability, context.collection.collection, primaryKey, 'read', {
				knex,
				schema,
			});

			// If the item doesn't exist, we check default collection permissions
			if (!allowedFields) {
				allowedFields =
					(await verifyPermissions(accountability, context.collection.collection, null, 'read', {
						knex,
						schema,
					})) ?? [];
			}

			// If item exists, we check if you have permissions to read the field
			if (allowedFields.length === 0 || (!allowedFields.includes('*') && !allowedFields.includes(String(key)))) return;

			// Process relational fields only reached if parent field is allowed
			if (context.relationType) {
				if (Array.isArray(value)) {
					const items = value.filter(isVisible);
					if (items.length === 0) return undefined;
					return [key, items];
				} else if (isDetailedUpdateSyntax(value)) {
					const filtered = {
						create: value.create.filter(isVisible),
						update: value.update.filter(isVisible),
						delete: value.delete.filter(isVisible),
					};

					if (filtered.create.length === 0 && filtered.update.length === 0 && filtered.delete.length === 0)
						return undefined;

					return [key, filtered];
				} else if (!isVisible(value)) {
					return undefined;
				}
			}

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
			processAsync: true,
		},
	);
}

// Identifies actionable content (non-empty/defined) to avoid processing invalid relation links
function isVisible(item: any) {
	return item !== undefined && !(typeof item === 'object' && item !== null && Object.keys(item).length === 0);
}
