import type { SchemaOverview } from '@directus/types';
import { getSimpleHash } from '@directus/utils';
import type { Options } from 'keyv';
import Keyv from 'keyv';
import { useEnv } from './env.js';
import { useLogger } from './logger.js';
import { getMessenger } from './messenger.js';
import { compress, decompress } from './utils/compress.js';
import { getConfigFromEnv } from './utils/get-config-from-env.js';
import { getMilliseconds } from './utils/get-milliseconds.js';
import { validateEnv } from './utils/validate-env.js';

import { createRequire } from 'node:module';

const logger = useLogger();
const env = useEnv();

const require = createRequire(import.meta.url);

let cache: Keyv | null = null;
let systemCache: Keyv | null = null;
let localSchemaCache: Keyv | null = null;
let sharedSchemaCache: Keyv | null = null;
let lockCache: Keyv | null = null;
let messengerSubscribed = false;

type Store = 'memory' | 'redis';

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
	cache: Keyv | null;
	systemCache: Keyv;
	sharedSchemaCache: Keyv;
	localSchemaCache: Keyv;
	lockCache: Keyv;
} {
	if (env['CACHE_ENABLED'] === true && cache === null) {
		validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
		cache = getKeyvInstance(env['CACHE_STORE'], getMilliseconds(env['CACHE_TTL']));
		cache.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	if (systemCache === null) {
		systemCache = getKeyvInstance(env['CACHE_STORE'], getMilliseconds(env['CACHE_SYSTEM_TTL']), '_system');
		systemCache.on('error', (err) => logger.warn(err, `[system-cache] ${err}`));
	}

	if (sharedSchemaCache === null) {
		sharedSchemaCache = getKeyvInstance(env['CACHE_STORE'], getMilliseconds(env['CACHE_SYSTEM_TTL']), '_schema_shared');
		sharedSchemaCache.on('error', (err) => logger.warn(err, `[shared-schema-cache] ${err}`));
	}

	if (localSchemaCache === null) {
		localSchemaCache = getKeyvInstance('memory', getMilliseconds(env['CACHE_SYSTEM_TTL']), '_schema');
		localSchemaCache.on('error', (err) => logger.warn(err, `[schema-cache] ${err}`));
	}

	if (lockCache === null) {
		lockCache = getKeyvInstance(env['CACHE_STORE'], undefined, '_lock');
		lockCache.on('error', (err) => logger.warn(err, `[lock-cache] ${err}`));
	}

	return { cache, systemCache, sharedSchemaCache, localSchemaCache, lockCache };
}

export async function flushCaches(forced?: boolean): Promise<void> {
	const { cache } = getCache();
	await clearSystemCache({ forced });
	await cache?.clear();
}

export async function clearSystemCache(opts?: {
	forced?: boolean | undefined;
	autoPurgeCache?: false | undefined;
}): Promise<void> {
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

export async function setSystemCache(key: string, value: any, ttl?: number): Promise<void> {
	const { systemCache, lockCache } = getCache();

	if (!(await lockCache.get('system-cache-lock'))) {
		await setCacheValue(systemCache, key, value, ttl);
	}
}

export async function getSystemCache(key: string): Promise<Record<string, any>> {
	const { systemCache } = getCache();

	return await getCacheValue(systemCache, key);
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

export async function setCacheValue(
	cache: Keyv,
	key: string,
	value: Record<string, any> | Record<string, any>[],
	ttl?: number,
) {
	const compressed = await compress(value);
	await cache.set(key, compressed, ttl);
}

export async function getCacheValue(cache: Keyv, key: string): Promise<any> {
	const value = await cache.get(key);
	if (!value) return undefined;
	const decompressed = await decompress(value);
	return decompressed;
}

function getKeyvInstance(store: Store, ttl: number | undefined, namespaceSuffix?: string): Keyv {
	switch (store) {
		case 'redis':
			return new Keyv(getConfig('redis', ttl, namespaceSuffix));
		case 'memory':
		default:
			return new Keyv(getConfig('memory', ttl, namespaceSuffix));
	}
}

function getConfig(store: Store = 'memory', ttl: number | undefined, namespaceSuffix = ''): Options<any> {
	const config: Options<any> = {
		namespace: `${env['CACHE_NAMESPACE']}${namespaceSuffix}`,
		ttl,
	};

	if (store === 'redis') {
		const KeyvRedis = require('@keyv/redis');
		config.store = new KeyvRedis(env['REDIS'] || getConfigFromEnv('REDIS'));
	}

	return config;
}
