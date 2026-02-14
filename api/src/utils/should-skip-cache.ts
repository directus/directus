import url from 'url';
import { useEnv } from '@directus/env';
import { getEndpoint } from '@directus/utils';
import type { Request } from 'express';
import { Url } from './url.js';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = useEnv();

	// Always skip cache for requests coming from the data studio based on Referer header
	const referer = req.get('Referer');

	if (referer) {
		const adminUrl = new Url(env['PUBLIC_URL'] as string).addPath('admin');

		if (adminUrl.isRootRelative()) {
			const refererUrl = new Url(referer);
			if (refererUrl.path.join('/').startsWith(adminUrl.path.join('/')) && checkAutoPurge()) return true;
		} else if (referer.startsWith(adminUrl.toString()) && checkAutoPurge()) {
			return true;
		}
	}

	if (
		env['CACHE_SKIP_ALLOWED'] &&
		(req.get('cache-control')?.includes('no-store') || req.get('cache-control')?.includes('no-cache'))
	)
		return true;

	return false;

	function checkAutoPurge() {
		if (env['CACHE_AUTO_PURGE'] === false) return true;

		const path = url.parse(req.originalUrl).pathname;

		if (!path) return false;

		for (const collection of env['CACHE_AUTO_PURGE_IGNORE_LIST'] as string[]) {
			const ignoredPath = getEndpoint(collection);

			if (path.startsWith(ignoredPath)) {
				return true;
			}
		}

		return false;
	}
}
