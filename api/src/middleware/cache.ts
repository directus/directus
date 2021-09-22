import { RequestHandler } from 'express';
import { getCache } from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import { getCacheKey } from '../utils/get-cache-key';
import logger from '../logger';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	const { cache } = getCache();

	if (req.method.toLowerCase() !== 'get') return next();
	if (env.CACHE_ENABLED !== true) return next();
	if (!cache) return next();

	if (req.headers['cache-control']?.includes('no-store') || req.headers['Cache-Control']?.includes('no-store')) {
		return next();
	}

	const key = getCacheKey(req);

	let cachedData;

	try {
		cachedData = await cache.get(key);
	} catch (err: any) {
		logger.warn(err, `[cache] Couldn't read key ${key}. ${err.message}`);
		return next();
	}

	if (cachedData) {
		let cacheExpiryDate;

		try {
			cacheExpiryDate = (await cache.get(`${key}__expires_at`)) as number | null;
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't read key ${`${key}__expires_at`}. ${err.message}`);
			return next();
		}

		const cacheTTL = cacheExpiryDate ? cacheExpiryDate - Date.now() : null;

		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL));
		res.setHeader('Vary', 'Origin, Cache-Control');

		return res.json(cachedData);
	} else {
		return next();
	}
});

export default checkCacheMiddleware;
