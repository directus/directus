import type { Accountability, SchemaOverview } from '@directus/types';
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
		action: 'create' | 'update' | 'read';
	},
) {
	const { accountability, schema, action, knex } = context;

	return await deepMapWithSchema(
		payload,
		async ([key, value], context) => {
			// Identifies actionable content (non-empty/defined) to avoid processing invalid relation links
			const isVisible = (item: any) =>
				item !== undefined && !(typeof item === 'object' && item !== null && Object.keys(item).length === 0);

			// Whitelist virtual fields that don't exist in the schema
			if (key === '$FOLLOW') {
				return [key, value];
			}

			// Strip sensitive fields
			if (context.field?.special?.some((v) => v === 'conceal' || v === 'hash')) {
				return undefined;
			}

			// Strip unknown leaf fields that are not in the schema
			if (context.leaf && !context.relation && !context.field) {
				return undefined;
			}

			if (value === undefined) return undefined;

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

			if (context.leaf || (context.relation && context.object[key] !== undefined)) {
				let id: string | number | undefined = undefined;

				const pk = context.collection.primary;

				if (context.object && pk in context.object) {
					id = context.object[pk] as any;
				}

				const requiredAction =
					action === 'read'
						? 'read'
						: (context.action ??
							(id !== undefined || (action === 'update' && (context.relation || (context.collection as any).singleton))
								? 'update'
								: 'create'));

				// Ambiguous action, try link (update) first, then fallback to create
				if (action !== 'read' && id !== undefined && context.action === undefined) {
					const updateAllowedFields = await verifyPermissions(
						accountability,
						context.collection.collection,
						id,
						'update',
						{ knex, schema },
					);

					const isPK = context.collection.primary === key;

					// If it's a relation or primary key, we check for visibility/identity
					if (isPK) {
						if (updateAllowedFields.length > 0) return [key, value];
					} else {
						// For relations and other fields, check specific field access
						if (updateAllowedFields.includes('*') || updateAllowedFields.includes(key as string)) return [key, value];
					}

					// Fallback to create (Client-Generated UUID)
					const createAllowedFields = await verifyPermissions(
						accountability,
						context.collection.collection,
						id,
						'create',
						{ knex, schema },
					);

					if (isPK) {
						if (createAllowedFields.length > 0) return [key, value];
					} else {
						if (createAllowedFields.includes('*') || createAllowedFields.includes(key as string)) return [key, value];
					}

					return undefined;
				}

				// Validate access for resolved ID (or singleton) and action
				const item = id ?? (action === 'update' && context.relation ? (value as string | number) : null);

				const allowedFields = await verifyPermissions(
					accountability,
					context.collection.collection,
					item,
					requiredAction,
					{ knex, schema },
				);

				if (allowedFields.length === 0) return undefined;

				if (context.collection.primary === key) {
					// Keep PK if user has access to at least one field (maintains identity)
					return [key, value];
				}

				if (
					(context.leaf || context.relation) &&
					!allowedFields.includes('*') &&
					!allowedFields.includes(key as string)
				) {
					// Field-level permission check for non-PK leaves/relations
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
