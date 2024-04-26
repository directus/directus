import { ForbiddenError } from '@directus/errors';
import { systemCollectionRows } from '@directus/system-data';
import type { RequestHandler } from 'express';

/**
 * Check if requested collection exists, and save it to req.collection
 */
const collectionExistsMiddleware: RequestHandler = (req, _res, next) => {
	if (!req.params['collection']) return next();

	if (!(req.params['collection'] in req.schema.collections)) {
		throw new ForbiddenError();
	}

	req.collection = req.params['collection'];

	const systemCollectionRow = systemCollectionRows.find((collection) => collection?.collection === req.collection);

	if (systemCollectionRow !== undefined) {
		req.singleton = !!systemCollectionRow?.singleton;
	} else {
		req.singleton = req.schema.collections[req.collection]?.singleton ?? false;
	}

	return next();
};

export default collectionExistsMiddleware;
