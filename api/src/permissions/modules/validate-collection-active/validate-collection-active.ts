import { CollectionInactiveError } from '@directus/errors';
import type { Accountability, PermissionsAction } from '@directus/types';
import type { Context } from '../../types.js';
import { createCollectionForbiddenError } from '../process-ast/utils/validate-path/create-error.js';
import { validateCollectionAccess } from '../validate-access/lib/validate-collection-access.js';

export interface ValidateCollectionActiveOptions {
	accountability: Accountability | null;
	action: PermissionsAction;
	collection: string;
}

/**
 * Check whether the given collection is active, and throw if it isn't.
 */
export async function validateCollectionActive(
	options: ValidateCollectionActiveOptions,
	context: Context,
): Promise<void> {
	const inactiveCollections = context.schema.inactiveCollections ?? [];

	if (!inactiveCollections.includes(options.collection)) return;

	const { accountability, collection, action } = options;

	if (accountability !== null && accountability.admin !== true) {
		const hasAccess = await validateCollectionAccess({ accountability, collection, action }, context);

		if (!hasAccess) {
			throw createCollectionForbiddenError('', collection);
		}
	}

	throw new CollectionInactiveError({ collection });
}
