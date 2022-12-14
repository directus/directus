import { validateEnv } from '../utils/validate-env';
import { registerDrivers } from './register-drivers';
import { registerLocations } from './register-locations';

// @ts-expect-error https://github.com/microsoft/TypeScript/issues/49721
import type { StorageManager } from '@directus/storage';

export const _cache: { storage: any | null } = {
	storage: null,
};

export const getStorage = async (): Promise<StorageManager> => {
	if (_cache.storage) return _cache.storage;

	const { StorageManager } = await import('@directus/storage');

	validateEnv(['STORAGE_LOCATIONS']);

	_cache.storage = new StorageManager();

	await registerDrivers(_cache.storage);
	await registerLocations(_cache.storage);

	return _cache.storage;
};
