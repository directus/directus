/**
 * Check if requested collection exists, and save it to req.collection
 */

import type { RequestHandler } from 'express';
import { systemCollectionRows } from '../database/system-data/collections/index.js';
import { ForbiddenException } from '../exceptions/index.js';
import asyncHandler from '../utils/async-handler.js';

const collectionExists: RequestHandler = asyncHandler(async (req, _res, next) => {
	if (!req.params['collection']) return next();

	const info = await req.schema.getCollection(req.params['collection'])

	if (!info) {
		throw new ForbiddenException();
	}

	req.collection = req.params['collection'];

	if (req.collection.startsWith('directus_')) {
		const systemRow = systemCollectionRows.find((collection) => {
			return collection?.collection === req.collection;
		});

		req.singleton = !!systemRow?.singleton;
	} else {
		req.singleton = info.singleton;
	}

	return next();
});

export default collectionExists;
