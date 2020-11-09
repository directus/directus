/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { schemaInspector } from '../database';

const sanitizeQueryMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	const schemaOverview = await schemaInspector.overview();

	console.log(schemaOverview);

	req.schema = schemaOverview;

	return next();
});

export default sanitizeQueryMiddleware;
