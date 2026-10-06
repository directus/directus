import type { PermissionsAction } from '@directus/types';
import getDatabase from '../database/index.js';
import { assertCollectionActive } from '../permissions/modules/assert-collection-active/assert-collection-active.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Check if requested collection is active
 */
const collectionActive = (action?: PermissionsAction) =>
	asyncHandler(async (req, _res, next) => {
		if (!req.params['collection']) return next();

		await assertCollectionActive(
			{
				accountability: req.accountability ?? createDefaultAccountability(),
				collection: req.params['collection'],
				action: action ?? mapMethod(req.method),
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
