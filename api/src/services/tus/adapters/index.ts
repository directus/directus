import type { DataStore } from '@tus/utils';
import { LocalFileStore } from './local.js';
import { S3FileStore } from './s3.js';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import type { AbstractServiceOptions } from '../../../types/services.js';
import { getDriverConfig } from '../utils/get-driver-config.js';

export function getTusAdapter(): DataStore & { init: (options: AbstractServiceOptions) => void } {
	const env = useEnv();
	const location = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
	const { driver, options } = getDriverConfig(location);

	// return the correct adapter based on the env
	switch (driver) {
		case 'local':
			console.log('local options', options)
			return new LocalFileStore(options['root']);
		case 's3':
			console.log('s3 options', options)
			return new S3FileStore(options);
		default:
			throw new Error(`unknown or unsupported storage adapter: ${driver}`);
	}
}
