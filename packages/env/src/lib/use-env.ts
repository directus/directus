import type { Env } from '../types/env.js';
import { createEnv } from './create-env.js';

export const _cache: {
	env: Env | undefined;
} = { env: undefined } as const;

export const useEnv = () => {
	if (_cache.env) {
		return _cache.env;
	}

	_cache.env = createEnv();

	return _cache.env;
};
