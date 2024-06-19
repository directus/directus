import { ForbiddenError } from '@directus/errors';
import type { Accountability, PermissionsAction, PrimaryKey } from '@directus/types';
import type { Context } from '../../types.js';
import { validateCollectionAccess } from './lib/validate-collection-access.js';
import { validateItemAccess } from './lib/validate-item-access.js';

export interface ValidateAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys?: PrimaryKey[];
}

/**
 * Validate if the current user has access to perform action against the given collection and
 * optional primary keys. This is done by reading the item from the database using the access
 * control rules and checking if we got the expected result back
 */
export async function validateAccess(options: ValidateAccessOptions, context: Context) {
	if (options.accountability.admin === true) {
		return;
	}

	let access;

	// If primary keys are passed, we have to confirm the access by actually trying to read the items
	// from the database. If no keys are passed, we can simply check if the collection+action combo
	// exists within permissions
	if (options.primaryKeys) {
		access = await validateItemAccess(options as Required<ValidateAccessOptions>, context);
	} else {
		access = await validateCollectionAccess(options, context);
	}

	if (!access) {
		throw new ForbiddenError({
			reason: `You don't have permission to "${options.action}" from collection "${options.collection}" or it does not exist.`,
		});
	}
}
