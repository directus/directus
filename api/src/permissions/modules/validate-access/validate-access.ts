import { ForbiddenError } from '@directus/errors';
import type { Accountability, PermissionsAction, PrimaryKey, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { validateCollectionAccess } from './lib/validate-collection-access.js';
import { validateItemAccess } from './lib/validate-item-access.js';

/**
 * Validate if the current user has access to perform action against the given collection and
 * optional primary keys. This is done by reading the item from the database using the access
 * control rules and checking if we got the expected result back
 */
export async function validateAccess(
	knex: Knex,
	schema: SchemaOverview,
	accountability: Accountability,
	action: PermissionsAction,
	collection: string,
	primaryKeys?: PrimaryKey[],
) {
	if (accountability.admin === true) {
		return;
	}

	let access = false;

	// If primary keys are passed, we have to confirm the access by actually trying to read the items
	// from the database. If no keys are passed, we can simply check if the collection+action combo
	// exists within permissions
	if (primaryKeys) {
		access = await validateItemAccess(knex, schema, accountability, action, collection, primaryKeys);
	} else {
		access = await validateCollectionAccess(knex, schema, accountability, action, collection);
	}

	if (!access) {
		throw new ForbiddenError({
			reason: `You don't have permission to "${action}" from collection "${collection}" or it does not exist.`,
		});
	}
}
