import { useEnv } from '@directus/env';
import type { StorageManager } from '@directus/storage';
import { toArray } from '@directus/utils';
import { RESUMABLE_UPLOADS } from '../constants.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import ms from 'ms';

export const registerLocations = async (storage: StorageManager) => {
	const env = useEnv();

	const locations = toArray(env['STORAGE_LOCATIONS'] as string);

	locations.forEach((location: string) => {
		location = location.trim();
		const driverConfig = getConfigFromEnv(`STORAGE_${location.toUpperCase()}_`);
		const { driver, ...options } = driverConfig;
		storage.registerLocation(location, { driver, options: getOptions(driver, options) });
	});
};

function getOptions(driver: string, options: Record<string, any>) {
	const tus = {
    enabled: RESUMABLE_UPLOADS.ENABLED,
		chunkSize: RESUMABLE_UPLOADS.CHUNK_SIZE,
	};

	const newOptions = { ...options };

	if (driver === 's3') {
		if (options['connectionTimeout']) newOptions['connectionTimeout'] = ms(options['connectionTimeout']);
		if (options['socketTimeout']) newOptions['socketTimeout'] = ms(options['socketTimeout']);
	}

	return { ...newOptions, tus };
}
