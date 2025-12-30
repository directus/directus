import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { useEnv } from '@directus/env';
import { Redis } from 'ioredis';

/**
 * Create a new Redis instance based on the global env configuration
 *
 * @returns New Redis instance based on global configuration
 */
export const createRedis = () => {
	const env = useEnv();
	return new Redis(env['REDIS'] ?? getConfigFromEnv('REDIS'));
};
