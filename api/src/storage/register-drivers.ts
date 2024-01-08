import { useEnv } from '@directus/env';
import type { StorageManager } from '@directus/storage';
import { getStorageDriver } from './get-storage-driver.js';

export const registerDrivers = async (storage: StorageManager) => {
	const env = useEnv();

	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(env)) {
		if ((key.startsWith('STORAGE_') && key.endsWith('_DRIVER')) === false) continue;
		if (value && usedDrivers.includes(value as string) === false) usedDrivers.push(value as string);
	}

	for (const driverName of usedDrivers) {
		const storageDriver = await getStorageDriver(driverName);

		if (storageDriver) {
			storage.registerDriver(driverName, storageDriver);
		}
	}
};
