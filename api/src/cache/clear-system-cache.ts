import { getMessenger } from '../messenger.js';
import { getCache } from './index.js';

export async function clearSystemCache(opts?: {
	forced?: boolean | undefined;
	autoPurgeCache?: false | undefined;
}): Promise<void> {
	const messenger = getMessenger();

	const { systemCache, localSchemaCache, lockCache, sharedSchemaCache } = getCache();

	// Flush system cache when forced or when system cache lock not set
	if (opts?.forced || !(await lockCache.get('system-cache-lock'))) {
		await lockCache.set('system-cache-lock', true, 10000);
		await systemCache.clear();
		await lockCache.delete('system-cache-lock');
	}

	await sharedSchemaCache.clear();
	await localSchemaCache.clear();
	messenger.publish('schemaChanged', { autoPurgeCache: opts?.autoPurgeCache });
}
