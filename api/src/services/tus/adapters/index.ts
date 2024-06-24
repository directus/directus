import type { DataStore } from '@tus/utils';
import { LocalFileStore, type LocalOptions } from './local.js';
// import { S3FileStore, type S3Options } from './s3.js';
import type stream from 'stream';
import type { ReadStream } from 'fs';

export interface DataStore2 extends DataStore {
	read(id: string): Promise<stream.Readable> | ReadStream;
}

export function getTusAdapter(opts: LocalOptions): DataStore2 {
	// return the correct adapter based on the env
	switch ('local') {
		case 'local':
			return new LocalFileStore(opts as LocalOptions);
		// case 's3':
		// 	return new S3FileStore(opts as S3Options);
	}

	// throw new Error('unknown or unsupported storage adapter');
}
