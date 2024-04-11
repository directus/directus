import { toArray } from '@directus/utils';
import { pick } from 'lodash-es';
import type { Env } from '../types/env.js';
import { useEnv } from './use-env.js';

export const _cache: {
	extensionsEnv: Env | undefined;
} = { extensionsEnv: undefined } as const;

export const useExtensionsEnv = () => {
	if (_cache.extensionsEnv) {
		return _cache.extensionsEnv;
	}

	const env = useEnv();

	const extensionsEnvAllowList = env['EXTENSIONS_ENV_ALLOW_LIST']
		? toArray(env['EXTENSIONS_ENV_ALLOW_LIST'] as string)
		: [];

	const extensionsEnv = extensionsEnvAllowList.includes('*') ? env : pick(env, extensionsEnvAllowList);

	if (!extensionsEnvAllowList.includes('*')) {
		for (const envKey of Object.keys(process.env)) {
			if (!extensionsEnvAllowList.includes(envKey)) {
				delete process.env[envKey];
			}
		}
	}

	_cache.extensionsEnv = extensionsEnv;

	return _cache.extensionsEnv;
};
