import { useEnv } from '@directus/env';
import type { Request } from 'express';
import { Url } from './url.js';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = useEnv();

	// Always skip cache for requests coming from the data studio (based on the Referer header) so the
	// studio returns the latest data regardless of cache settings.
	const referer = req.get('Referer');

	if (referer) {
		const adminUrl = new Url(env['PUBLIC_URL'] as string).addPath('admin');

		if (adminUrl.isRootRelative()) {
			const refererUrl = new Url(referer);
			if (refererUrl.path.join('/').startsWith(adminUrl.path.join('/'))) return true;
		} else if (referer.startsWith(adminUrl.toString())) {
			return true;
		}
	}

	if (env['CACHE_SKIP_ALLOWED'] && req.get('cache-control')?.includes('no-store')) return true;

	return false;
}
