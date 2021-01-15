import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import { schemaInspector } from '../database';
import logger from '../logger';

const getSchema: RequestHandler = asyncHandler(async (req, res, next) => {
	const schemaOverview = await schemaInspector.overview();

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			delete schemaOverview[collection];
		}
	}

	req.schema = schemaOverview;

	return next();
});

export default getSchema;
