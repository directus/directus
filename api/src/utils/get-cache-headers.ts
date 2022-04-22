import env from '../env';
import { Request } from 'express';

/**
 * Returns the Cache-Control header for the current request
 *
 * @param req Express request object
 * @param ttl TTL of the cache in ms
 */
export function getCacheControlHeader(req: Request, ttl: number | null): string {
	// When the resource / current request isn't cached
	if (ttl === null) return 'no-cache';

	// When the API cache can invalidate at any moment
	if (env.CACHE_AUTO_PURGE === true) return 'no-cache';

	const noCacheRequested =
		req.headers['cache-control']?.includes('no-store') || req.headers['Cache-Control']?.includes('no-store');

	// When the user explicitly asked to skip the cache
	if (noCacheRequested) return 'no-store';

	// Cache control header uses seconds for everything
	const ttlSeconds = Math.round(ttl / 1000);

	const access = !!req.accountability?.role === false ? 'public' : 'private';

	let headerValue = `${access}, max-age=${ttlSeconds}`;

	// When the s-maxage flag should be included
	if (env.CACHE_CONTROL_S_MAXAGE !== false) {
		// Default to regular max-age flag when true
		if (env.CACHE_CONTROL_S_MAXAGE === true) {
			headerValue += `, s-maxage=${ttlSeconds}`;
		} else {
			// Set to custom value
			headerValue += `, s-maxage=${env.CACHE_CONTROL_S_MAXAGE}`;
		}
	}

	return headerValue;
}
