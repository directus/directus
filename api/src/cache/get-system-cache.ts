import { getCacheValue } from './get-cache-value.js';
import { getCache } from './index.js';

export async function getSystemCache(key: string): Promise<Record<string, any>> {
	const { systemCache } = getCache();

	return await getCacheValue(systemCache, key);
}
