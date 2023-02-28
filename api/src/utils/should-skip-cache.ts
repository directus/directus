import { Request } from 'express';
import { getEnv } from '../env';

/**
 * Whether to skip caching for the current request
 *
 * @param req Express request object
 */

export function shouldSkipCache(req: Request): boolean {
	const env = getEnv();

	if (env.CACHE_SKIP_ALLOWED === false) return false;

	return req.get('cache-control')?.includes('no-store') ?? false;
}
