// @ts-expect-error https://github.com/microsoft/TypeScript/issues/49721
import type { StorageManager } from '@directus/storage';

import { getEnv } from '../env';
import { toArray } from '@directus/shared/utils';
import { getConfigFromEnv } from '../utils/get-config-from-env';

export const registerLocations = async (storage: StorageManager) => {
	const env = getEnv();

	const locations = toArray(env.STORAGE_LOCATIONS);

	locations.forEach((location: string) => {
		location = location.trim();
		const options = getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`);
		const { driver } = options;
		delete options.driver;
		storage.registerLocation(location, { driver, options });
	});
};
