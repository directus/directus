import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import type { Driver, Range } from '@directus/storage';
import { Storage } from '@google-cloud/storage';
import type { StorageOptions, Bucket } from '@google-cloud/storage';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

export type DriverGCSConfig = {
	root?: string;
	bucket: string;
} & StorageOptions;

export class DriverGCS implements Driver {
	private root: string;
	private bucket: Bucket;

	constructor(config: DriverGCSConfig) {
		const { bucket, root, ...storageOptions } = config;

		this.root = root ? normalizePath(root, { removeLeading: true }) : '';

		const storage = new Storage(storageOptions);
		this.bucket = storage.bucket(bucket);
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	private file(filepath: string) {
		return this.bucket.file(this.fullPath(filepath));
	}

	async getStream(filepath: string, range?: Range) {
		return this.file(filepath).createReadStream(range);
	}

	async getBuffer(filepath: string) {
		return (await this.file(filepath).download())[0];
	}

	async getStat(filepath: string) {}

	async exists(filepath: string) {}

	async move(src: string, dest: string) {}

	async copy(src: string, dest: string) {}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type = 'application/octet-stream') {}

	async delete(filepath: string) {}

	async *list(prefix = '') {}
}

export default DriverGCS;
