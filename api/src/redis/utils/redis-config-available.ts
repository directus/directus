import { useEnv } from '@directus/env';

/**
 * Environment variables that start with `REDIS_` but don't configure a connection. These have
 * defaults, so they're always present and can't be used to infer that Redis is configured.
 */
const NON_CONNECTION_KEYS = new Set([
	'REDIS_ENABLED',
	'REDIS_BUS_NAMESPACE',
	'REDIS_LOCK_NAMESPACE',
	'REDIS_PERMISSIONS_NAMESPACE',
	'REDIS_COUNTERS_NAMESPACE',
]);

/**
 * Check if Redis configuration exists in the current project's environment configuration
 */
export const redisConfigAvailable = () => {
	const env = useEnv();

	if (env.REDIS_ENABLED !== undefined) {
		return env.REDIS_ENABLED;
	}

	return 'REDIS' in env || Object.keys(env).some((key) => key.startsWith('REDIS_') && !NON_CONNECTION_KEYS.has(key));
};
