import type { Request } from 'express';
import { getEnv } from '../env';
import { Url } from './url';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = getEnv();

	// Always skip cache for requests coming from the data studio based on Referer header
	const adminUrl = new Url(env.PUBLIC_URL).addPath('admin').toString();
	if (req.get('Referer')?.startsWith(adminUrl)) return true;

	if (env.CACHE_SKIP_ALLOWED && req.get('cache-control')?.includes('no-store')) return true;

	return false;
}
