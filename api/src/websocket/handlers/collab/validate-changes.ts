import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Accountability, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { deepMapWithSchema } from '../../../utils/versioning/deep-map-with-schema.js';
import { verifyPermissions } from './verify-permissions.js';

/**
 * Validates a changes payload against the user's update/create permissions and errors if unauthorized field is encountered.
 */
export async function validateChanges(
	payload: any,
	collection: string,
	itemId: PrimaryKey | null,
	context: {
		knex: Knex;
		schema: SchemaOverview;
		accountability: Accountability | null;
	},
) {
	const { accountability, schema, knex } = context;

	await deepMapWithSchema(
		payload,
		async ([key, value], context) => {
			if (value === undefined) return;

			const currentCollection = context.collection.collection;
			const pkField = context.collection.primary;
			const primaryKey = (context.object[pkField] ?? null) as PrimaryKey | null;
			let action: 'create' | 'update' | 'delete' = 'update';
			let effectiveItemId = primaryKey;
			const isTopLevel = context.object === payload;

			if (isTopLevel) {
				effectiveItemId = itemId;
				action = itemId ? 'update' : 'create';
			} else {
				if (!primaryKey) {
					action = 'create';
				}
			}

			// Fetailed update syntax defines the action via context.action
			if (context.action && context.action !== 'delete') {
				action = context.action as 'create' | 'update';
			}

			if (context.action === 'delete') {
				action = 'delete';
			}

			if (action === 'delete') {
				// For delete actions, we only allow PK
				if (key !== pkField) {
					throw new InvalidPayloadError({
						reason: `Unexpected field ${key} in delete payload`,
					});
				}

				const allowedFields = await verifyPermissions(accountability, currentCollection, primaryKey, 'delete', {
					knex,
					schema,
				});

				if (allowedFields === null || (allowedFields.length === 0 && !accountability?.admin)) {
					throw new ForbiddenError({
						reason: `No permission to delete item in collection ${currentCollection}`,
					});
				}

				return;
			}

			// Allow PK field for identification
			if (action === 'update' && key === pkField) {
				return;
			}

			let allowedFields = await verifyPermissions(accountability, currentCollection, effectiveItemId, action, {
				knex,
				schema,
			});

			// If item has a PK but verifyPermissions returns null means it doesn't exist
			if (action === 'update' && allowedFields === null) {
				action = 'create';

				allowedFields = await verifyPermissions(accountability, currentCollection, effectiveItemId, action, {
					knex,
					schema,
				});
			}

			if (
				!allowedFields ||
				(allowedFields.length === 0 && !accountability?.admin) ||
				(!allowedFields.includes('*') && !allowedFields.includes(String(key)))
			) {
				throw new ForbiddenError({
					reason: `No permission to ${action} field ${key} or field does not exist`,
				});
			}
		},
		{
			schema,
			collection,
		},
		{
			detailedUpdateSyntax: true,
			omitUnknownFields: false,
			mapPrimaryKeys: true,
			processAsync: true,
			iterateOnly: true,
			onUnknownField: ([key]) => {
				if (String(key).startsWith('$')) return;

				throw new ForbiddenError({
					reason: `No permission to update field ${key} or field does not exist`,
				});
			},
		},
	);
}
