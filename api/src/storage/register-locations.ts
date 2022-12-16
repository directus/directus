// @ts-expect-error https://github.com/microsoft/TypeScript/issues/49721
import type { StorageManager } from '@directus/storage';

import { toArray } from '@directus/shared/utils';
import { getEnv } from '../env';
import { getConfigFromEnv } from '../utils/get-config-from-env';

export const registerLocations = async (storage: StorageManager) => {
	const env = getEnv();

	const locations = toArray(env.STORAGE_LOCATIONS);

	locations.forEach((location: string) => {
		location = location.trim();
		const driverConfig = getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`);
		const { driver, ...options } = driverConfig;
		storage.registerLocation(location, { driver, options });
	});
};
