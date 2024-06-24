import type { DataStore } from '@tus/utils';
import { LocalFileStore, type LocalOptions } from './local.js';
import { S3FileStore, type S3Options } from './s3.js';

export function getTusAdapter(opts: LocalOptions | S3Options): DataStore {
	// return the correct adapter based on the env
	switch('local' as string) {
		case 'local':
			return new LocalFileStore(opts as LocalOptions);
		case 's3':
			return new S3FileStore(opts as S3Options);
	}

	throw new Error('unknown or unsupported storage adapter');
}
