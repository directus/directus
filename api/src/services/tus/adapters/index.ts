import type { DataStore } from '@tus/utils';
import { LocalFileStore } from './local.js';
// import { S3FileStore, type S3Options } from './s3.js';
import { useEnv } from '@directus/env';
import { toArray } from '@directus/utils';
import type { AbstractServiceOptions } from '../../../types/services.js';

export function getTusAdapter(): DataStore & { init: (options: AbstractServiceOptions) => void } {
	const env = useEnv();

	// return the correct adapter based on the env
	switch (toArray(env['STORAGE_LOCATIONS'] as string)[0]!) {
		case 'local':
			return new LocalFileStore();
		// case 's3':
		// 	return new S3FileStore(opts as S3Options);
		default:
			throw new Error('unknown or unsupported storage adapter');
	}
}
