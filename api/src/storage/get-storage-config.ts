import type { StorageManagerConfig } from '@directus/drive';
import { toArray } from '@directus/shared/utils';
import { getEnv } from '../env';
import { getConfigFromEnv } from '../utils/get-config-from-env';

export const getStorageConfig = () => {
	const env = getEnv();

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
};
