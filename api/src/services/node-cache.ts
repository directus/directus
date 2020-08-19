/** node cache service.
 *  Makes dealing with cache management easier
 *  in case a new cache is used in future
 *  sdtTTL is the amount of time a cache should be
 *  stored, in seconds, before being deleted. Keep
 *  checkPeriod is the amount of seconds for the
 *  autodelete to wait before checking
 *  if cache needs to be deleted.
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
	// delete the cache with the given key. Casted to string by node-cache
	// so might as well do it here too for consitancy

	async delCache(keys: string) {
		this.apiCache.del(keys);
	}
	// attempt to get the cache based on the key, if it is empty then set it

	async getCache(key: string, setData: JSON) {
		// first get the value
		const value = this.apiCache.get(key);

		if (value) {
			return Promise.resolve(value);
		}

		this.apiCache.set(key, setData);
		return setData;
	}

	// this flushes all data. important!
	async flushCache() {
		this.apiCache.flushAll();
	}
}
