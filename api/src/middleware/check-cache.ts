import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import CacheService from '../services/cache';
import env from '../env';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	if (env.CACHE_ENABLED !== true) return next();

	return next();
});

export default checkCacheMiddleware;
