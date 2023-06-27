import Keyv from 'keyv';
import env from '../env.js';
import logger from '../logger.js';
import { getMessenger } from '../messenger.js';
import { getMilliseconds } from '../utils/get-milliseconds.js';
import { validateEnv } from '../utils/validate-env.js';

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
