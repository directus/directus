/** node cache service.
 *  Makes dealing with cache management easier
 *  in case a new cache is used in future
 *  sdtTTL is the amount of time a cache should be
 *  stored, in seconds, before being deleted. Keep
 * this is mind
 */
import NodeCache from 'node-cache';

export default class NodeCacheService {
	apiCache: NodeCache;

	constructor(stdTTLSecs: number, checkPeriodSecs: number) {
		// options found at https://github.com/node-cache/node-cache
		this.apiCache = new NodeCache({
			stdTTL: stdTTLSecs,
			checkperiod: checkPeriodSecs,
			useClones: false,
		});
	}

	async flushCache() {
		this.apiCache.flushAll();
	}
}
