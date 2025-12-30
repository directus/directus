import { createCache } from './create.js';
import type { Cache } from '../types/class.js';
import type { CacheConfig } from '../types/config.js';

export const defineCache = (config: CacheConfig) => {
	let cache: Cache;

	const useCache = () => {
		if (cache) return cache;
		cache = createCache(config);
		return cache;
	};

	return useCache;
};
