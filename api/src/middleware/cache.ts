import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import env from '../env';
import { getCacheKey } from '../utils/get-cache-key';

import cache from '../cache';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	if (req.method.toLowerCase() !== 'get') return next();
	if (env.CACHE_ENABLED !== true) return next();
	if (!cache) return next();

	if (req.headers['cache-control']?.includes('no-cache') || req.headers['Cache-Control']?.includes('no-cache')) {
		return next();
	}

	const key = getCacheKey(req);
	const cachedData = await cache.get(key);

	if (cachedData) {
		// Set cache-control header
		if (env.CACHE_AUTO_PURGE !== true) {
			const expiresAt = await cache.get(`${key}__expires_at`);
			const maxAge = `max-age=${expiresAt - Date.now()}`;
			const access = !!req.accountability?.role === false ? 'public' : 'private';
			res.setHeader('Cache-Control', `${access}, ${maxAge}`);
		}

		return res.json(cachedData);
	} else {
		return next();
	}
});

export default checkCacheMiddleware;
