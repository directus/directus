import { StorageManager } from '@directus/drive';
import { validateEnv } from '../utils/validate-env';
import { getStorageConfig } from './get-storage-config';
import { registerDrivers } from './register-drivers';

export let _storage: StorageManager;

export const getStorage = async () => {
	if (_storage) return _storage;

	validateEnv(['STORAGE_LOCATIONS']);

	_storage = new StorageManager(getStorageConfig());

	registerDrivers(_storage);

	return _storage;
};
