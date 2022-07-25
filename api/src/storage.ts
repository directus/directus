import { LocalFileSystemStorage, Storage, StorageManager, StorageManagerConfig } from '@directus/drive';
import { AzureBlobWebServicesStorage } from '@directus/drive-azure';
import { GoogleCloudStorage } from '@directus/drive-gcs';
import { AmazonWebServicesS3Storage } from '@directus/drive-s3';
import env from './env';
import { getConfigFromEnv } from './utils/get-config-from-env';
import { toArray } from '@directus/shared/utils';
import { validateEnv } from './utils/validate-env';
import { getExtensionManager } from './extensions';

validateEnv(['STORAGE_LOCATIONS']);

const storage = new StorageManager(getStorageConfig());

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

export function registerDrivers() {
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
		default:
			return getStorageDriverFromExtensions(driver);
	}
}

function getStorageDriverFromExtensions(driver: string) {
	const extensionManager = getExtensionManager();
	const storagesExtensions = extensionManager.getApiExtensions().storages;
	const storageExtension = storagesExtensions.find((storageExtension) => {
		return storageExtension.config.id === driver;
	});
	if (storageExtension) {
		return storageExtension!.config.driver;
	}
}
