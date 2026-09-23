import { useEnv } from '@directus/env';

/**
 * Check if Redis configuration exists in the current project's environment configuration
 */
export const redisConfigAvailable = () => {
	const env = useEnv();

	if (env.REDIS_ENABLED !== undefined) {
		return env.REDIS_ENABLED;
	}

	return 'REDIS' in env || Object.keys(env).some((key) => key.startsWith('REDIS_'));
};
