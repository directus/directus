import { Request } from 'express';
import { getEnv } from '../env';
import { Url } from './url';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = getEnv();

	if (env.CACHE_SKIP_ALLOWED === false) return false;

	// always skip cache for requests coming from the data studio based on Referer header
	const adminUrl = new Url(env.PUBLIC_URL).addPath('admin').toString();
	if (req.get('Referer')?.startsWith(adminUrl)) return true;

	return req.get('cache-control')?.includes('no-store') ?? false;
}
