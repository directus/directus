/**
 * Check if requested collection exists, and save it to req.collection
 */

import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import database from '../database';
import { ForbiddenException } from '../exceptions';
import { systemCollectionRows } from '../database/system-data/collections';

const collectionExists: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.params.collection) return next();

	if (req.params.collection in req.schema === false) {
		throw new ForbiddenException();
	}

	req.collection = req.params.collection;

	if (req.collection.startsWith('directus_')) {
		const systemRow = systemCollectionRows.find((collection) => {
			return collection?.collection === req.collection;
		});

		req.singleton = !!systemRow?.singleton;
	} else {
		const collectionInfo = await database
			.select('singleton')
			.from('directus_collections')
			.where({ collection: req.collection })
			.first();

		req.singleton = collectionInfo?.singleton === true || collectionInfo?.singleton === 1;
	}

	return next();
});

export default collectionExists;
