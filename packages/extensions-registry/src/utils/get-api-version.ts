import ky from 'ky';
import { DEFAULT_REGISTRY } from '../constants.js';
import { RegistryVersionResponse } from '../schemas/registry-version-response.js';
import { handleRegistryError } from './handle-registry-error.js';

export interface GetApiVersionOptions {
	registry?: string;
}

export const _cache: Map<string, string> = new Map();

export const getApiVersion = async (options?: GetApiVersionOptions) => {
	const registry = options?.registry ?? DEFAULT_REGISTRY;

	if (_cache.has(registry)) {
		return _cache.get(registry)!;
	}

	try {
		const response = await ky.get(new URL('/version', registry)).json();

		const { version } = await RegistryVersionResponse.parseAsync(response);

		_cache.set(registry, version);

		// Invalidate the memoization at least every 6 hours
		setTimeout(() => _cache.delete(registry), 6 * 60 * 60 * 1000);

		return _cache.get(registry)!;
	} catch (error) {
		handleRegistryError(error);
	}
};
