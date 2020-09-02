import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';

/**
 *  middleware to manage actions on responses such as
 * export / import and caching
 * @todo move caching into here.
 *
 */

const responseManager: RequestHandler = asyncHandler(async (req, res, next) => {
	return next();
});

export default responseManager;
