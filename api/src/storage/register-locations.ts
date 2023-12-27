import { useEnv } from '@directus/env';
import type { StorageManager } from '@directus/storage';
import { toArray } from '@directus/utils';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';

export const registerLocations = async (storage: StorageManager) => {
	const env = useEnv();

	const locations = toArray(env['STORAGE_LOCATIONS'] as string);

	locations.forEach((location: string) => {
		location = location.trim();
		const driverConfig = getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`);
		const { driver, ...options } = driverConfig;
		storage.registerLocation(location, { driver, options });
	});
};
