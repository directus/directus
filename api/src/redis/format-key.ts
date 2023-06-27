import { getEnv } from '../env.js';

export const formatKey = (scope: string, key: string) => {
	const env = getEnv();
	const namespace = env['REDIS_NAMESPACE'] ?? 'directus';
	return `${namespace}:${scope}:${key}`;
};
