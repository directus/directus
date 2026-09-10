import { CollectionInactiveError } from '@directus/errors';
import type { Accountability, PermissionsAction } from '@directus/types';
import { isCollectionActive } from '@directus/utils';
import { getCollectionFromSchema } from '../../../utils/schema/get-collection-from-schema.js';
import type { Context } from '../../types.js';
import { createCollectionForbiddenError } from '../process-ast/utils/validate-path/create-error.js';
import { validateCollectionAccess } from '../validate-access/lib/validate-collection-access.js';

export interface AssertCollectionActiveOptions {
	accountability: Accountability | null;
	action: PermissionsAction;
	collection: string;
}

/**
 * Check whether the given collection is active, and throw if it isn't.
 */
export async function assertCollectionActive(options: AssertCollectionActiveOptions, context: Context): Promise<void> {
	const { accountability, collection, action } = options;

	const collectionOverview = getCollectionFromSchema(context.schema, collection);

	if (isCollectionActive(collectionOverview)) return;

	if (accountability !== null && accountability.admin !== true) {
		const hasAccess = await validateCollectionAccess({ accountability, collection, action }, context);

		if (!hasAccess) {
			throw createCollectionForbiddenError('', collection);
		}
	}

	throw new CollectionInactiveError({ collection });
}
