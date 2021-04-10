import { StorageManager, LocalFileSystemStorage, StorageManagerConfig, Storage } from '@directus/drive';
import env from './env';
import { validateEnv } from './utils/validate-env';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { toArray } from './utils/to-array';

/** @todo dynamically load these storage adapters */
import { AmazonWebServicesS3Storage } from '@directus/drive-s3';
import { GoogleCloudStorage } from '@directus/drive-gcs';
import { AzureBlobWebServicesStorage } from '@directus/drive-azure';

validateEnv(['STORAGE_LOCATIONS']);

const storage = new StorageManager(getStorageConfig());

registerDrivers(storage);

export default storage;

function getStorageConfig(): StorageManagerConfig {
	const config: StorageManagerConfig = {
		disks: {},
	};

	const locations = toArray(env.STORAGE_LOCATIONS);

	locations.forEach((location: string) => {
		location = location.trim();

		const diskConfig = {
			driver: env[`STORAGE_${location.toUpperCase()}_DRIVER`],
			config: getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`),
		};

		delete diskConfig.config.publicUrl;
		delete diskConfig.config.driver;

		config.disks![location] = diskConfig;
	});

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
		case 'azure':
			return AzureBlobWebServicesStorage;
	}
}
