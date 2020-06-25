/**
 * Check if you're allowed to add an additional item when POSTing to a singleton
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import database from '../database';
import APIError, { ErrorCode } from '../error';

const validateCollection: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.collection) return next();

	const collectionInfo = await req.loaders.collections.load(req.collection);

	if (!collectionInfo) return next();

	if (collectionInfo.single === false) return next();

	const { count } = await database.count('*').as('count').from(req.collection).first();

	if (Number(count) === 0) return next();

	throw new APIError(
		ErrorCode.TOO_MANY_ITEMS,
		`You can only create a single item in singleton "${req.collection}"`
	);
});

export default validateCollection;
