import { useEnv } from '@directus/env';
import { getCache, getCacheValue } from '../cache.js';
import { useLogger } from '../logger.js';
import asyncHandler from '../utils/async-handler.js';
import { getCacheControlHeader } from '../utils/get-cache-headers.js';
import { getCacheKey } from '../utils/get-cache-key.js';
import { shouldSkipCache } from '../utils/should-skip-cache.js';

export const cache = asyncHandler(async (req, res, next) => {
	const env = useEnv();
	const { cache } = getCache();
	const logger = useLogger();

	if (req.method.toLowerCase() !== 'get' && req.originalUrl?.startsWith('/graphql') === false) return next();
	if (env['CACHE_ENABLED'] !== true) return next();
	if (!cache) return next();

	if (shouldSkipCache(req)) {
		if (env['CACHE_STATUS_HEADER']) res.setHeader(`${env['CACHE_STATUS_HEADER']}`, 'MISS');
		return next();
	}

	const key = getCacheKey(req);

	let cachedData;

	try {
		cachedData = await getCacheValue(cache, key);
	} catch (error) {
		logger.warn(error, `[cache] Couldn't read key ${key}`);
		if (env['CACHE_STATUS_HEADER']) res.setHeader(`${env['CACHE_STATUS_HEADER']}`, 'MISS');
		return next();
	}

	if (cachedData) {
		let cacheExpiryDate;

		try {
			cacheExpiryDate = (await getCacheValue(cache, `${key}__expires_at`))?.exp;
		} catch (error) {
			logger.warn(error, `[cache] Couldn't read key ${`${key}__expires_at`}`);
			if (env['CACHE_STATUS_HEADER']) res.setHeader(`${env['CACHE_STATUS_HEADER']}`, 'MISS');
			return next();
		}

		const cacheTTL = cacheExpiryDate ? cacheExpiryDate - Date.now() : undefined;

		res.setHeader('Cache-Control', getCacheControlHeader(req, cacheTTL, true, true));
		res.setHeader('Vary', 'Origin, Cache-Control');
		if (env['CACHE_STATUS_HEADER']) res.setHeader(`${env['CACHE_STATUS_HEADER']}`, 'HIT');
		return res.json(cachedData);
	}

	if (env['CACHE_STATUS_HEADER']) res.setHeader(`${env['CACHE_STATUS_HEADER']}`, 'MISS');

	return next();
});
