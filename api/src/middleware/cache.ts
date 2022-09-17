import { RequestHandler } from 'express';
import { getCache, getCacheValue } from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import { getCacheKey } from '../utils/get-cache-key';
import logger from '../logger';

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	const { cache } = getCache();

	if (req.method.toLowerCase() !== 'get' && req.originalUrl?.startsWith('/graphql') === false) return next();
	if (env.CACHE_ENABLED !== true) return next();
	if (!cache) return next();

	if (req.headers['cache-control']?.includes('no-store') || req.headers['Cache-Control']?.includes('no-store')) {
		if (env.CACHE_STATUS_HEADER) res.setHeader(`${env.CACHE_STATUS_HEADER}`, 'MISS');
		return next();
	}

	const key = getCacheKey(req);

	let cachedData;

	try {
		cachedData = await getCacheValue(cache, key);
	} catch (err: any) {
		logger.warn(err, `[cache] Couldn't read key ${key}. ${err.message}`);
		if (env.CACHE_STATUS_HEADER) res.setHeader(`${env.CACHE_STATUS_HEADER}`, 'MISS');
		return next();
	}

	if (cachedData) {
		let cacheExpiryDate;

		try {
			cacheExpiryDate = (await getCacheValue(cache, `${key}__expires_at`))?.exp;
		} catch (err: any) {
			logger.warn(err, `[cache] Couldn't read key ${`${key}__expires_at`}. ${err.message}`);
			if (env.CACHE_STATUS_HEADER) res.setHeader(`${env.CACHE_STATUS_HEADER}`, 'MISS');
			return next();
		}

		const cacheTTL = cacheExpiryDate ? cacheExpiryDate - Date.now() : null;

		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL));
		res.setHeader('Vary', 'Origin, Cache-Control');
		if (env.CACHE_STATUS_HEADER) res.setHeader(`${env.CACHE_STATUS_HEADER}`, 'HIT');

		return res.json(cachedData);
	} else {
		if (env.CACHE_STATUS_HEADER) res.setHeader(`${env.CACHE_STATUS_HEADER}`, 'MISS');
		return next();
	}
});

export default checkCacheMiddleware;
