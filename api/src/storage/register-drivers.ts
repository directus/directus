import type { Storage, StorageManager } from '@directus/drive';
import { getEnv } from '../env';
import { getStorageDriver } from './get-storage-driver';

export const registerDrivers = (storage: StorageManager) => {
	const env = getEnv();

	const usedDrivers: string[] = [];

	for (const [key, value] of Object.entries(env)) {
		if ((key.startsWith('STORAGE') && key.endsWith('DRIVER')) === false) continue;
		if (value && usedDrivers.includes(value) === false) usedDrivers.push(value);
	}

	usedDrivers.forEach((driver) => {
		const storageDriver = getStorageDriver(driver);

		if (storageDriver) {
			storage.registerDriver<Storage>(driver, storageDriver);
		}
	});
};
