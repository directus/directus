import { validateEnv } from '../utils/validate-env';

export const _cache: { storage: any | null } = {
	storage: null,
};

export const getStorage = async () => {
	if (_cache.storage) return _cache.storage;

	const { StorageManager } = await import('@directus/storage');
	const { DriverLocal } = await import('@directus/storage-driver-local');

	validateEnv(['STORAGE_LOCATIONS']);

	// _cache._storage = new StorageManager(getStorageConfig());

	// registerDrivers(_cache._storage);

	_cache.storage = new StorageManager();

	// @TODO replace with dynamic calls
	_cache.storage.registerDriver('local', DriverLocal);
	_cache.storage.registerLocation('local', {
		driver: 'local',
		options: {
			root: './uploads',
		},
	});

	return _cache.storage;
};
