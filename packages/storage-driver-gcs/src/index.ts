import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import type { Driver, Range } from '@directus/storage';
import type { Bucket, GetFilesOptions, StorageOptions } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

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

	async getStat(filepath: string) {
		const [{ size, updated }] = await this.file(filepath).getMetadata();
		return { size, modified: updated };
	}

	async exists(filepath: string) {
		return (await this.file(filepath).exists())[0];
	}

	async move(src: string, dest: string) {
		await this.file(src).move(this.file(dest));
	}

	async copy(src: string, dest: string) {
		await this.file(src).copy(this.file(dest));
	}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string) {
		const file = this.file(filepath);

		if (isReadableStream(content)) {
			const stream = file.createWriteStream({ resumable: false });
			await pipeline(content, stream);
		} else {
			await file.save(content, { resumable: false });
		}
	}

	async delete(filepath: string) {
		await this.file(filepath).delete();
	}

	async *list(prefix = '') {
		let query: GetFilesOptions = {
			prefix: this.fullPath(prefix),
			autoPaginate: false,
			maxResults: 500,
		};

		while (query) {
			const [files, nextQuery] = await this.bucket.getFiles(query);

			for (const file of files) {
				yield file.name.substring(this.root.length);
			}

			query = nextQuery;
		}
	}
}

export default DriverGCS;
