import { RequestHandler } from 'express';
import cache from '../cache';
import env from '../env';
import asyncHandler from '../utils/async-handler';
import { getCacheKey } from '../utils/get-cache-key';

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
		// Set cache-control header, but only for the public role
		if (env.CACHE_AUTO_PURGE !== true && !!req.accountability?.role === false) {
			const expiresAt = await cache.get(`${key}__expires_at`);
			const maxAge = `max-age=${expiresAt - Date.now()}`;
			res.setHeader('Cache-Control', `public, ${maxAge}`);
		} else {
			// This indicates that the browser/proxy is allowed to cache, but has to revalidate with
			// the server before use. At this point, we don't include Last-Modified, so it'll always
			// recreate the local cache. This does NOT mean that cache is disabled all together, as
			// Directus is still pulling the value from it's internal cache.
			res.setHeader('Cache-Control', 'no-cache');
		}

		return res.json(cachedData);
	} else {
		return next();
	}
});

export default checkCacheMiddleware;
