/** node cache service.
 *  Makes dealing with cache management easier
 *  in case a new cache is used in future
 *  sdtTTL is the amount of time a cache should be
 *  stored, in seconds, before being deleted. Keep
 *  checkPeriod is the amount of seconds for the
 *  autodelete to wait before checking
 *  if cache needs to be deleted.
 *  Have wrapped node cache so we can extend if needed
 */
import NodeCache from 'node-cache';
import { InvalidCacheKeyException } from '../exceptions';

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
		if (!keys) {
			throw new InvalidCacheKeyException('Keys was not provided for cache');
		}
		this.apiCache.del(keys);
	}
	// attempt to get the cache based on the key, if it is empty then set it
	// am aware there is json interface but not sure but looks like endpoints
	// convert string to json

	async getCache(key: string, setData: string) {
		if (!setData) {
			throw new InvalidCacheKeyException('No response data was provided for cache');
		}
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
