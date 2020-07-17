/**
 * Check if requested collection exists, and save it to req.collection
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import database from '../database';
import { ForbiddenException } from '../exceptions';

const collectionExists: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.params.collection) return next();

	const exists = await database.schema.hasTable(req.params.collection);

	if (exists === false) {
		throw new ForbiddenException();
	}

	req.collection = req.params.collection;

	const { single } = await database
		.select('single')
		.from('directus_collections')
		.where({ collection: req.collection })
		.first();

	req.single = single;

	return next();
});

export default collectionExists;
