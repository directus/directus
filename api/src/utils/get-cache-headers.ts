import { shouldSkipCache } from './should-skip-cache.js';
import { useEnv } from '@directus/env';
import type { Request } from 'express';

/**
 * Returns the Cache-Control header for the current request
 *
 * @param req Express request object
 * @param ttl TTL of the cache in ms
 * @param globalCacheSettings Whether requests are affected by the global cache settings (i.e. for dynamic API requests)
 * @param personalized Whether requests depend on the authentication status of users
 */
export function getCacheControlHeader(
	req: Request,
	ttl: number | undefined,
	globalCacheSettings: boolean,
	personalized: boolean,
): string {
	const env = useEnv();

	// When the user explicitly asked to skip the cache
	if (shouldSkipCache(req)) return 'no-store';

	// When the resource / current request shouldn't be cached
	if (ttl === undefined || ttl < 0) return 'no-cache';

	// When the API cache can invalidate at any moment
	if (globalCacheSettings && env['CACHE_AUTO_PURGE'] === true) return 'no-cache';

	const headerValues = [];

	// When caching depends on the authentication status of the users
	if (personalized) {
		// Allow response to be stored in shared cache (public) or local cache only (private)
		const access = !!req.accountability?.role === false ? 'public' : 'private';
		headerValues.push(access);
	}

	// Cache control header uses seconds for everything
	const ttlSeconds = Math.round(ttl / 1000);
	headerValues.push(`max-age=${ttlSeconds}`);

	// When the s-maxage flag should be included
	if (
		globalCacheSettings &&
		Number.isInteger(env['CACHE_CONTROL_S_MAXAGE']) &&
		(env['CACHE_CONTROL_S_MAXAGE'] as number) >= 0
	) {
		headerValues.push(`s-maxage=${env['CACHE_CONTROL_S_MAXAGE']}`);
	}

	return headerValues.join(', ');
}
