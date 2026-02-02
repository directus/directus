import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, PrimaryKey, SchemaOverview } from '@directus/types';
import { deepMapWithSchema, isDetailedUpdateSyntax } from '@directus/utils';
import type { Knex } from 'knex';
import { isVirtualRoomItem } from './is-virtual-room-item.js';
import { verifyPermissions } from './verify-permissions.js';

type PermissionContext = {
	knex: Knex;
	schema: SchemaOverview;
	accountability: Accountability | null;
	itemId?: PrimaryKey | null;
	direction?: 'inbound' | 'outbound';
};

/**
 * Validates a changes payload against the user's update/create permissions and errors if unauthorized field is encountered
 */
export async function validateChanges(
	payload: any,
	collection: string,
	itemId: PrimaryKey | null,
	context: PermissionContext,
) {
	return processPermissions(payload, collection, { ...context, itemId, direction: 'inbound' });
}

/**
 * Sanitizes a payload based on the recipient's read permissions and the schema
 */
export async function sanitizePayload(payload: any, collection: string, context: PermissionContext) {
	return processPermissions(payload, collection, { ...context, direction: 'outbound' });
}

/**
 * Core utility to walk a payload and apply permissions
 */
async function processPermissions(
	payload: any,
	collection: string,
	context: PermissionContext & { direction: 'inbound' | 'outbound' },
) {
	const { direction, accountability, schema, knex, itemId } = context;

	// Local cache for permissions to avoid redundant verifyPermissions calls for the same item:action pair
	// The promise is cached, so concurrent field lookups for the same item wait for the same result
	const permissionsCache = new Map<string, Promise<string[] | null>>();

	const getPermissions = (col: string, id: PrimaryKey | null, action: 'read' | 'create' | 'update' | 'delete') => {
		const cacheKey = `${col}:${id}:${action}`;
		let cached = permissionsCache.get(cacheKey);

		if (!cached) {
			cached = verifyPermissions(accountability, col, id, action, { knex, schema });
			permissionsCache.set(cacheKey, cached);
		}

		return cached;
	};

	return deepMapWithSchema(
		payload,
		async (entry, deepMapContext) => {
			const [key, value] = entry;

			if (direction === 'outbound') {
				// Strip sensitive fields
				if (deepMapContext.field?.special?.some((v) => v === 'conceal' || v === 'hash' || v === 'encrypt')) {
					return undefined;
				}

				// Strip unknown leaf fields
				if (deepMapContext.leaf && !deepMapContext.relation && !deepMapContext.field) {
					return undefined;
				}
			}

			if (value === undefined) return undefined;

			// Resolve the action (CRUD) and the ID to check against
			const currentCollection = deepMapContext.collection.collection;
			const pkField = deepMapContext.collection.primary;
			const primaryKeyInObject = (deepMapContext.object[pkField] ?? null) as PrimaryKey | null;

			let action: 'read' | 'create' | 'update' | 'delete' = direction === 'inbound' ? 'update' : 'read';
			let effectiveItemId = primaryKeyInObject;

			if (direction === 'inbound') {
				const isTopLevel = deepMapContext.object === payload;

				// At the top level, we use the ID from the request context (itemId)
				// Deeply nested objects must provide their own ID for update checks
				if (isTopLevel) {
					effectiveItemId = itemId ?? null;
					action = itemId ? 'update' : 'create';
				} else if (!primaryKeyInObject) {
					action = 'create';
				}

				if (deepMapContext.action) {
					action = deepMapContext.action as 'create' | 'update' | 'delete';
				}
			} else {
				// sanitizePayload uses context.itemId as a fallback for the root item
				if (deepMapContext.object === payload) {
					effectiveItemId = primaryKeyInObject ?? itemId ?? null;
				}
			}

			// Ensure no unexpected fields sneak into a delete operation
			if (direction === 'inbound' && action === 'delete') {
				if (key !== pkField) {
					throw new InvalidPayloadError({ reason: `Unexpected field ${key} in delete payload` });
				}

				const allowed = await getPermissions(currentCollection, primaryKeyInObject, 'delete');

				if (allowed === null || (allowed.length === 0 && !accountability?.admin)) {
					throw new ForbiddenError({ reason: `No permission to delete item in collection ${currentCollection}` });
				}

				return;
			}

			// Allow PK field for identification on updates
			if (direction === 'inbound' && action === 'update' && key === pkField) {
				return;
			}

			let allowedFields = await getPermissions(currentCollection, effectiveItemId, action);

			// Fallbacks
			if (!allowedFields || (allowedFields.length === 0 && isVirtualRoomItem(effectiveItemId))) {
				if (direction === 'inbound' && action === 'update') {
					// Toggle to create if update fails due to non-existence
					action = 'create';
					allowedFields = await getPermissions(currentCollection, effectiveItemId, action);
				} else if (direction === 'outbound') {
					// Fall back to collection-wide read
					allowedFields = (await getPermissions(currentCollection, null, 'read')) ?? [];
				}
			}

			const isAllowed =
				allowedFields && (accountability?.admin || allowedFields.includes('*') || allowedFields.includes(String(key)));

			if (!isAllowed) {
				if (direction === 'inbound') {
					throw new ForbiddenError({ reason: `No permission to ${action} field ${key} or field does not exist` });
				}

				return undefined;
			}

			// Remove the relation field entirely from the payload if it's empty after sanitizing its children
			if (direction === 'outbound' && deepMapContext.relationType) {
				if (Array.isArray(value)) {
					const items = value.filter(isVisible);
					if (items.length === 0) return undefined;
					return [key, items];
				} else if (isDetailedUpdateSyntax(value)) {
					const filtered: any = {
						...value,
						create: value.create.filter(isVisible),
						update: value.update.filter(isVisible),
						delete: value.delete.filter(isVisible),
					};

					if (filtered.create.length === 0 && filtered.update.length === 0 && filtered.delete.length === 0) {
						return undefined;
					}

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
			omitUnknownFields: direction === 'outbound',
			mapPrimaryKeys: true,
			processAsync: true,
			iterateOnly: direction === 'inbound', // Validation only needs to check permissions, not rebuild the payload
			onUnknownField: (entry) => {
				const [key] = entry;

				// Allow Directus internal metadata keys like $type
				if (String(key).startsWith('$')) return entry;

				if (direction === 'inbound') {
					throw new ForbiddenError({ reason: `No permission to update field ${key} or field does not exist` });
				}

				return undefined;
			},
		},
	);
}

// Identifies non-empty or defined actionable content to avoid processing invalid relation links
function isVisible(item: any) {
	return item !== undefined && !(typeof item === 'object' && item !== null && Object.keys(item).length === 0);
}
