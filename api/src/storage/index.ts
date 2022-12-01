import { validateEnv } from '../utils/validate-env';

export const _cache: { storage: any | null } = {
	storage: null,
};

export const getStorage = async () => {
	if (_cache.storage) return _cache.storage;

	const { StorageManager } = await eval(`import('@directus/storage')`);
	const { DriverLocal } = await eval(`import('@directus/storage-driver-local')`);

	validateEnv(['STORAGE_LOCATIONS']);

	// _cache._storage = new StorageManager(getStorageConfig());

	// registerDrivers(_cache._storage);

	_cache.storage = new StorageManager();
	_cache.storage.registerDriver('local', DriverLocal);
	_cache.storage.registerLocation('local', {
		driver: 'local',
		options: {
			root: './uploads',
		},
	});

	return _cache.storage;
};
