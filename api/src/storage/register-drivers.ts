import type { StorageManager, Storage } from '@directus/drive';
import { getStorageDriver } from './get-storage-driver';
import { getEnv } from '../env';

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
