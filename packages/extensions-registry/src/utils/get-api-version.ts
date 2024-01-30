import ky from 'ky';
import { DEFAULT_REGISTRY } from '../constants.js';
import { RegistryVersionResponse } from '../schemas/registry-version-response.js';

export interface GetApiVersionOptions {
	registry?: string;
}

export const _cache: Record<string, string> = {};

export const getApiVersion = async (options?: GetApiVersionOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;

	if (registry in _cache) {
		return _cache[registry];
	}

	const response = await ky.get(new URL('/version', registry)).json();

	const { version } = await RegistryVersionResponse.parseAsync(response);

	_cache[registry] = version;

	// Invalidate the memoization at least every 6 hours
	setTimeout(() => delete _cache[registry], 6 * 60 * 60 * 1000);

	return _cache[registry];
};
