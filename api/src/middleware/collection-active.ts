import type { PermissionsAction } from '@directus/types';
import getDatabase from '../database/index.js';
import { validateCollectionActive } from '../permissions/modules/validate-collection-active/validate-collection-active.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Check if requested collection is active
 */
const collectionActive = asyncHandler(async (req, _res, next) => {
	if (!req.params['collection']) return next();

	await validateCollectionActive(
		{
			accountability: req.accountability ?? createDefaultAccountability(),
			collection: req.params['collection'],
			action: mapMethod(req.method),
		},
		{ schema: req.schema, knex: getDatabase() },
	);

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
