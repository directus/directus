import env from './env';
import Keyv from 'keyv';
import { validateEnv } from './utils/validate-env';

let cache: Keyv | null = null;

if (env.CACHE_ENABLED === true) {
	validateEnv(['CACHE_NAMESPACE', 'CACHE_TTL', 'CACHE_STORE']);
	cache = new Keyv({ namespace: env.CACHE_NAMESPACE, ttl: env.CACHE_TTL });
}

export default cache;
