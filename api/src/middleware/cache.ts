import { Request, RequestHandler } from 'express';
import { getCache } from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheControlHeader } from '../utils/get-cache-headers';
import { getCacheKey } from '../utils/get-cache-key';
import logger from '../logger';
import url from 'url';

const canBeCached = (req: Request) => {
	if (req.method.toLowerCase() === 'get') {
		return true;
	}

	if (req.method.toLowerCase() === 'post') {
		const path = url.parse(req.originalUrl).pathname;
		const isGraphQl = path?.includes('/graphql');

		/**
		 * Verifying that request is a GraphQL query (not mutation) is not required there,
		 * because operations other that queries are not cached (api/src/middleware/respond.ts).
		 *
		 * Question is whether it is more performant
		 * to check the operation type here (probably it would require parsing gql)
		 * or to evaluate key and verify that it is missing from cache (current assumption).
		 */
		return isGraphQl;
	}

	return false;
};

const checkCacheMiddleware: RequestHandler = asyncHandler(async (req, res, next) => {
	if (env.CACHE_ENABLED !== true) return next();
	const { cache } = getCache();
	if (!cache) return next();
	if (!canBeCached(req)) return next();

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
