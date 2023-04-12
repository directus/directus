import { getEnv } from '../env.js';
import { getStorageDriver } from './get-storage-driver.js';
import type { StorageManager } from '@directus/storage';

export const registerDrivers = async (storage: StorageManager) => {
	const env = getEnv();

	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(env)) {
		if ((key.startsWith('STORAGE_') && key.endsWith('_DRIVER')) === false) continue;
		if (value && usedDrivers.includes(value) === false) usedDrivers.push(value);
	}

	for (const driverName of usedDrivers) {
		const storageDriver = await getStorageDriver(driverName);

		if (storageDriver) {
			storage.registerDriver(driverName, storageDriver);
		}
	}
};
