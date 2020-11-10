import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { schemaInspector } from '../database';

const getSchema: RequestHandler = asyncHandler(async (req, res, next) => {
	const schemaOverview = await schemaInspector.overview();
	req.schema = schemaOverview;

	return next();
});

export default getSchema;
