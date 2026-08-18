/**
 * Check if requested collection exists, and save it to req.collection
 */

import { CollectionInactiveError } from '@directus/errors';
import { systemCollectionRows } from '@directus/system-data';
import type { PermissionsAction } from '@directus/types';
import type { RequestHandler } from 'express';
import getDatabase from '../database/index.js';
import { createCollectionForbiddenError } from '../permissions/modules/process-ast/utils/validate-path/create-error.js';
import { validateCollectionAccess } from '../permissions/modules/validate-access/lib/validate-collection-access.js';
import asyncHandler from '../utils/async-handler.js';

const collectionExists: RequestHandler = asyncHandler(async (req, _res, next) => {
	if (!req.params['collection']) return next();

	if (req.params['collection'] in req.schema.collections === false) {
		if (req.accountability && req.schema.inactiveCollections?.includes(req.params['collection'])) {
			const hasAccess =
				req.accountability.admin === true ||
				(await validateCollectionAccess(
					{
						accountability: req.accountability,
						collection: req.params['collection'],
						action: mapMethod(req.method),
					},
					{
						schema: req.schema,
						knex: getDatabase(),
					},
				));

			if (hasAccess) {
				throw new CollectionInactiveError({
					collection: req.params['collection'],
				});
			}
		}

		throw createCollectionForbiddenError('', req.params['collection']);
	}

	req.collection = req.params['collection'];

	const systemCollectionRow = systemCollectionRows.find((collection) => {
		return collection?.collection === req.collection;
	});

	if (systemCollectionRow !== undefined) {
		req.singleton = !!systemCollectionRow?.singleton;
	} else {
		req.singleton = req.schema.collections[req.collection]?.singleton ?? false;
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

export default collectionExists;
