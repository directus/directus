import { registerDrivers } from './register-drivers.js';
import { registerLocations } from './register-locations.js';
import { validateEnv } from '../utils/validate-env.js';
import type { StorageManager } from '@directus/storage';

export const _cache: { storage: any | null } = {
	storage: null,
};

export const getStorage = async (): Promise<StorageManager> => {
	if (_cache.storage) return _cache.storage;

	const { StorageManager } = await import('@directus/storage');

	validateEnv(['STORAGE_LOCATIONS']);

	const storage = new StorageManager();

	await registerDrivers(storage);
	await registerLocations(storage);

	_cache.storage = storage;

	return storage;
};
