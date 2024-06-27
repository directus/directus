import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import { TusDataStore } from '@directus/tus-driver';
import { getDriverConfig } from './utils/get-driver-config.js';
import { RESUMABLE_UPLOADS } from '../../constants.js';
import { useLogger } from '../../logger.js';

export const tusDriverMap = {
	local: '@directus/tus-driver-local',
	s3: '@directus/tus-driver-s3',
};

export async function getTusAdapter(): Promise<TusDataStore> {
	const env = useEnv();
	const logger = useLogger();
	const location = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
	const { driver, options } = getDriverConfig(location);

	const config = {
		constants: RESUMABLE_UPLOADS,
		options,
		logger,
	}

	// return the correct adapter based on the env
	switch (driver) {
		case 'local': {
			const LocalFileStore = await loadTusAdapter('local');
			return new LocalFileStore(config);
		}

		case 's3': {
			const S3FileStore = await loadTusAdapter('s3');
			return new S3FileStore(config);
		}

		default:
			throw new Error(`unknown or unsupported storage adapter: ${driver}`);
	}
}

export async function loadTusAdapter(driverName: keyof typeof tusDriverMap): Promise<typeof TusDataStore> {
	const packageName = tusDriverMap[driverName];

	return (await import(packageName)).default;
}
