import { getCache } from './index.js';
import { setCacheValue } from './set-cache-value.js';

export async function setSystemCache(key: string, value: any, ttl?: number): Promise<void> {
	const { systemCache, lockCache } = getCache();

	if (!(await lockCache.get('system-cache-lock'))) {
		await setCacheValue(systemCache, key, value, ttl);
	}
}
