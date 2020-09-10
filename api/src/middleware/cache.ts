import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import env from '../env';
import { getCacheKey } from '../utils/get-cache-key';

import cache from '../cache';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	if (req.method.toLowerCase() !== 'get') return next();
	if (env.CACHE_ENABLED !== true) return next();
	if (!cache) return next();

	const key = getCacheKey(req);
	const cachedData = await cache.get(key);

	if (cachedData) {
		return res.json(cachedData);
	} else {
		return next();
	}
});

export default checkCacheMiddleware;
