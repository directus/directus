import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs';

/**
 *  middleware to manage actions on responses such as
 * export / import and caching
 * @todo move caching into here.
 *
 */

const responseManager: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.query.export) return next();

	const exportType = req.query.export;

	if (exportType === 'json') {
		// have chose to export json
	}

	if (exportType === 'csv') {
		// have chosen to export csv
	}

	return next();
});

export default responseManager;
