/**
 * Check if you're allowed to add an additional item when POSTing to a singleton
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import database from '../database';
import { ItemLimitException } from '../exceptions';

const validateCollection: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.collection) return next();

	const collectionInfo = await database
		.select('single')
		.from('directus_collections')
		.where({ collection: req.collection })
		.first();

	if (!collectionInfo) return next();

	if (collectionInfo.single === false) return next();

	const { count } = await database.count('*').as('count').from(req.collection).first();

	if (Number(count) === 0) return next();

	throw new ItemLimitException(
		`You can only create a single item in singleton "${req.collection}"`
	);
});

export default validateCollection;
