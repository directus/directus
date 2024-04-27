import { ForbiddenError } from '@directus/errors';
import { systemCollectionRows } from '@directus/system-data';
import type { RequestHandler } from 'express';

/**
 * Check if requested collection exists, and store it under `req.collection` along with `req.singleton`.
 */
export const collectionExists: RequestHandler = (req, _res, next) => {
	const collection = req.params['collection'];

	if (!collection) return next();

	if (!(collection in req.schema.collections)) {
		throw new ForbiddenError();
	}

	req.collection = collection;

	const systemCollectionRow = systemCollectionRows.find((collection) => collection?.collection === req.collection);

	if (systemCollectionRow) {
		req.singleton = !!systemCollectionRow.singleton;
	} else {
		req.singleton = req.schema.collections[req.collection]?.singleton ?? false;
	}

	return next();
};
