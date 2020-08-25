import {
	StorageManager,
	LocalFileSystemStorage,
	StorageManagerConfig,
	Storage,
} from '@slynova/flydrive';
import parseEnv from './utils/parse-env';
import env from './env';

import { AmazonWebServicesS3Storage } from '@slynova/flydrive-s3';
import { GoogleCloudStorage } from '@slynova/flydrive-gcs';

/** @todo dynamically load storage adapters here */

const storage = new StorageManager(getStorageConfig());

registerDrivers(storage);

export default storage;

function getStorageConfig(): StorageManagerConfig {
	const config = parseEnv(1, 'storage');

	return config;
}

function registerDrivers(storage: StorageManager) {
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
}

function getStorageDriver(driver: string) {
	switch (driver) {
		case 'local':
			return LocalFileSystemStorage;
		case 's3':
			return AmazonWebServicesS3Storage;
		case 'gcs':
			return GoogleCloudStorage;
	}
}
