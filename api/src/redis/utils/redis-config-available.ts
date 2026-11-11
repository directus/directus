import { DEFAULTS, useEnv } from '@directus/env';

/**
 * Check if Redis configuration exists in the current project's environment configuration
 */
export const redisConfigAvailable = () => {
	const env = useEnv();

	if ('REDIS_ENABLED' in env) {
		return env['REDIS_ENABLED'] === true;
	}

	return (
		'REDIS' in env ||
		Object.entries(env).some(
			([key, value]) =>
				key.startsWith('REDIS_') && (!(key in DEFAULTS) || value !== DEFAULTS[key as keyof typeof DEFAULTS]),
		)
	);
};
