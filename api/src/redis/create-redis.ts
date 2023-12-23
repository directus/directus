import { Redis } from 'ioredis';
import { useEnv } from '../env.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';

/**
 * Create a new Redis instance based on the global env configuration
 *
 * @returns New Redis instance based on global configuration
 */
export const createRedis = () => {
	const env = useEnv();
	return new Redis(env['REDIS'] ?? getConfigFromEnv('REDIS'));
};
