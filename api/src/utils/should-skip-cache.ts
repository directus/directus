import { getEndpoint } from '@directus/utils';
import type { Request } from 'express';
import url from 'url';
import { getEnv } from '../env.js';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = getEnv();

	// Always skip cache for requests coming from the data studio
	if (req.accountability && req.accountability.app_name === 'directus-data-studio' && checkAutoPurge()) {
		return true;
	}

	if (env['CACHE_SKIP_ALLOWED'] && req.get('cache-control')?.includes('no-store')) return true;

	return false;

	function checkAutoPurge() {
		if (env['CACHE_AUTO_PURGE'] === false) return true;

		const path = url.parse(req.originalUrl).pathname;

		if (!path) return false;

		for (const collection of env['CACHE_AUTO_PURGE_IGNORE_LIST']) {
			const ignoredPath = getEndpoint(collection);

			if (path.startsWith(ignoredPath)) {
				return true;
			}
		}

		return false;
	}
}
