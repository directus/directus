import { clearSystemCache } from './clear-system-cache.js';
import { getCache } from './index.js';

export async function flushCaches(forced?: boolean): Promise<void> {
	const { cache } = getCache();
	await clearSystemCache({ forced });
	await cache?.clear();
}
