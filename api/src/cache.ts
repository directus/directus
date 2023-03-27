import env from './env';
import { validateEnv } from './utils/validate-env';
import { getMessenger } from './messenger';
import { getSimpleHash } from '@directus/shared/utils';
import type { SchemaOverview } from '@directus/shared/types';
import type { CacheOptions, CacheService } from './services/cache/cache';
import { RedisCache } from './services/cache/redis-cache';
import { MemoryCache } from './services/cache/memory-cache';
import { clearSystemCache } from './utils/clearSystemCache';
import { getMilliseconds } from './utils/get-milliseconds';

let cache: CacheService | null = null;
let systemCache: CacheService | null = null;
let localSchemaCache: CacheService | null = null;
let sharedSchemaCache: CacheService | null = null;
let lockCache: CacheService | null = null;
let messengerSubscribed = false;

const messenger = getMessenger();

if (
	env['MESSENGER_STORE'] === 'redis' &&
	env['CACHE_STORE'] === 'memory' &&
	env['CACHE_AUTO_PURGE'] &&
	!messengerSubscribed
) {
	messengerSubscribed = true;

	messenger.subscribe('schemaChanged', async (opts) => {
		if (cache && opts?.['autoPurgeCache'] !== false) {
			await cache.clear();
		}
	});
}

export function getCache(): {
	cache: CacheService | null;
	systemCache: CacheService;
	sharedSchemaCache: CacheService;
	localSchemaCache: CacheService;
	lockCache: CacheService;
} {
	if (env['CACHE_ENABLED'] === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getCacheInstance(env['CACHE_TTL'] ? getMilliseconds(env['CACHE_TTL'] as string) : undefined, '_data');
	}

	if (systemCache === null) {
		systemCache = getCacheInstance(
			env['CACHE_SYSTEM_TTL'] ? getMilliseconds(env['CACHE_SYSTEM_TTL'] as string) : undefined,
			'_system'
		);
	}

	if (sharedSchemaCache === null) {
		sharedSchemaCache = getCacheInstance(
			env['CACHE_SYSTEM_TTL'] ? getMilliseconds(env['CACHE_SYSTEM_TTL'] as string) : undefined,
			'_schema_shared'
		);
	}

	if (localSchemaCache === null) {
		localSchemaCache = getCacheInstance(
			env['CACHE_SYSTEM_TTL'] ? getMilliseconds(env['CACHE_SYSTEM_TTL'] as string) : undefined,
			'_schema'
		);
	}

	if (lockCache === null) {
		lockCache = getCacheInstance(undefined, '_lock');
	}

	return { cache, systemCache, sharedSchemaCache, localSchemaCache, lockCache };
}

export async function flushCaches(forced?: boolean): Promise<void> {
	const { cache } = getCache();
	await clearSystemCache(forced);
	await cache?.clear();
}

export async function setSchemaCache(schema: SchemaOverview): Promise<void> {
	const { localSchemaCache, sharedSchemaCache } = getCache();
	const schemaHash = await getSimpleHash(JSON.stringify(schema));

	await sharedSchemaCache.set('hash', schemaHash);

	await localSchemaCache.set('schema', schema);
	await localSchemaCache.set('hash', schemaHash);
}

export async function getSchemaCache(): Promise<SchemaOverview | undefined> {
	const { localSchemaCache, sharedSchemaCache } = getCache();

	const sharedSchemaHash = await sharedSchemaCache.get('hash');
	if (!sharedSchemaHash) return;

	const localSchemaHash = await localSchemaCache.get('hash');
	if (!localSchemaHash || localSchemaHash !== sharedSchemaHash) return;

	return await localSchemaCache.get('schema');
}

function getCacheInstance(ttl: number | undefined, namespaceSuffix: string, checkLock = false): CacheService {
	const config: CacheOptions = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
		checkLock,
	};

	switch (env['CACHE_STORE']) {
		case 'redis':
			return new RedisCache(config);
		case 'memory':
		default:
			return new MemoryCache(config);
	}
}
