import { ForbiddenError } from '@directus/errors';
import type { Accountability, PermissionsAction, PrimaryKey } from '@directus/types';
import type { Context } from '../../types.js';
import { createCollectionForbiddenError } from '../process-ast/utils/validate-path/create-error.js';
import { validateCollectionAccess } from './lib/validate-collection-access.js';
import { validateItemAccess } from './lib/validate-item-access.js';

export interface ValidateAccessOptions {
	accountability: Accountability;
	action: PermissionsAction;
	collection: string;
	primaryKeys?: PrimaryKey[];
	fields?: string[];
	skipCollectionExistsCheck?: boolean;
}

/**
 * Validate if the current user has access to perform action against the given collection and
 * optional primary keys. This is done by reading the item from the database using the access
 * control rules and checking if we got the expected result back
 */
export async function validateAccess(options: ValidateAccessOptions, context: Context) {
	// Skip further validation if the collection does not exist
	if (!options.skipCollectionExistsCheck && options.collection in context.schema.collections === false) {
		throw createCollectionForbiddenError('', options.collection);
	}

	if (options.accountability.admin === true) {
		return;
	}

	let access: boolean;

	// If primary keys are passed, we have to confirm the access by actually trying to read the items
	// from the database. If no keys are passed, we can simply check if the collection+action combo
	// exists within permissions
	if (options.primaryKeys) {
		const result = await validateItemAccess(options as Required<ValidateAccessOptions>, context);
		access = result.accessAllowed;
	} else {
		access = await validateCollectionAccess(options, context);
	}

	if (!access) {
		if (options.fields?.length ?? 0 > 0) {
			throw new ForbiddenError({
				reason: `You don't have permissions to perform "${options.action}" for the field(s) ${options
					.fields!.map((field) => `"${field}"`)
					.join(', ')} in collection "${options.collection}" or it does not exist.`,
			});
		}

		throw new ForbiddenError({
			reason: `You don't have permission to perform "${options.action}" for collection "${options.collection}" or it does not exist.`,
		});
	}
}
