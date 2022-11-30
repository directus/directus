import { StorageManager } from '@directus/drive';
import { validateEnv } from '../utils/validate-env';
import { getStorageConfig } from './get-storage-config';
import { registerDrivers } from './register-drivers';

export const _cache: { _storage: StorageManager | null } = {
	_storage: null,
};

export const getStorage = async () => {
	if (_cache._storage) return _cache._storage;

	validateEnv(['STORAGE_LOCATIONS']);

	_cache._storage = new StorageManager(getStorageConfig());

	registerDrivers(_cache._storage);

	return _cache._storage;
};
