import type Keyv from 'keyv';
import { useEnv } from '../env.js';
import type { MutationOptions } from '../types/items.js';

/**
 * Check whether cache should be cleared
 *
 * @param cache Cache instance
 * @param opts Mutation options
 * @param collection Collection name to check if cache purging should be ignored
 */
export function shouldClearCache(
	cache: Keyv<any> | null,
	opts?: MutationOptions,
	collection?: string,
): cache is Keyv<any> {
	const env = useEnv();

	if (env['CACHE_AUTO_PURGE']) {
		if (collection && env['CACHE_AUTO_PURGE_IGNORE_LIST'].includes(collection)) {
			return false;
		}

		if (cache && opts?.autoPurgeCache !== false) {
			return true;
		}
	}

	return false;
}
