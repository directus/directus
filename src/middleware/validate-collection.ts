/**
 * Check if requested collection exists, and save it to req.collection
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import database from '../database';
import { RouteNotFoundException } from '../exceptions';

const validateCollection: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.params.collection) return next();

	const exists = await database.schema.hasTable(req.params.collection);

	if (exists) {
		req.collection = req.params.collection;
		return next();
	}

	throw new RouteNotFoundException(req.path);
});

export default validateCollection;
