import { CollectionInactiveError } from '@directus/errors';
import type { PermissionsAction } from '@directus/types';
import getDatabase from '../database/index.js';
import { createCollectionForbiddenError } from '../permissions/modules/process-ast/utils/validate-path/create-error.js';
import { validateCollectionAccess } from '../permissions/modules/validate-access/lib/validate-collection-access.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Check if requested collection is active
 */
const collectionActive = asyncHandler(async (req, _res, next) => {
	if (!req.params['collection']) return next();

	const accountability = req.accountability;
	const collection = req.params['collection'];
	const inactiveCollections = req.schema.inactiveCollections ?? [];

	if (inactiveCollections.includes(collection)) {
		let hasAccess = accountability?.admin === true;

		if (!hasAccess && !!accountability) {
			hasAccess = await validateCollectionAccess(
				{ accountability, collection, action: mapMethod(req.method) },
				{ schema: req.schema, knex: getDatabase() },
			);
		}

		if (hasAccess) {
			throw new CollectionInactiveError({ collection });
		} else {
			throw createCollectionForbiddenError('', collection);
		}
	}

	return next();
});

function mapMethod(method: string): PermissionsAction {
	switch (method.toUpperCase()) {
		case 'POST':
			return 'create';
		case 'PATCH':
			return 'update';
		case 'DELETE':
			return 'delete';
		case 'GET':
		default:
			return 'read';
	}
}

export default collectionActive;
