import { DEFAULT_CHUNK_SIZE } from '@directus/constants';
import type { TusDriver } from '@directus/storage';
import type { ChunkedUploadContext, ReadOptions } from '@directus/types';
import { normalizePath } from '@directus/utils';
import type { Bucket, CreateReadStreamOptions, GetFilesOptions } from '@google-cloud/storage';
import { Storage } from '@google-cloud/storage';
import { join } from 'node:path';
import { type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MINIMUM_CHUNK_SIZE = 262_144; // 256kb in bytes

export type DriverGCSConfig = {
	root?: string;
	bucket: string;
	apiEndpoint?: string;
	tus?: {
		enabled: boolean;
		chunkSize?: number;
	};
};

export class DriverGCS implements TusDriver {
	private root: string;
	private bucket: Bucket;

	// TUS specific members
	private readonly preferredChunkSize: number;

	constructor(config: DriverGCSConfig) {
		const { bucket, root, tus, ...storageOptions } = config;

		this.root = root ? normalizePath(root, { removeLeading: true }) : '';

		const storage = new Storage(storageOptions);
		this.bucket = storage.bucket(bucket);

		this.preferredChunkSize = tus?.chunkSize || DEFAULT_CHUNK_SIZE;

		// chunkSize must be powers of 2 starting at 256kb
		if (
			tus?.enabled &&
			(this.preferredChunkSize < MINIMUM_CHUNK_SIZE || Math.log2(this.preferredChunkSize) % 1 !== 0)
		) {
			throw new Error('Invalid chunkSize provided');
		}
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	private file(filepath: string) {
		return this.bucket.file(filepath);
	}

	async read(filepath: string, options?: ReadOptions) {
		const { range } = options || {};

		const stream_options: CreateReadStreamOptions = {};

		if (range?.start) stream_options.start = range.start;
		if (range?.end) stream_options.end = range.end;

		return this.file(this.fullPath(filepath)).createReadStream(stream_options);
	}

	async write(filepath: string, content: Readable) {
		const file = this.file(this.fullPath(filepath));
		const stream = file.createWriteStream({ resumable: false });
		await pipeline(content, stream);
	}

	async delete(filepath: string) {
		await this.file(this.fullPath(filepath)).delete();
	}

	async stat(filepath: string) {
		const [{ size, updated }] = await this.file(this.fullPath(filepath)).getMetadata();
		return { size: size as number, modified: new Date(updated as string) };
	}

	async exists(filepath: string) {
		return (await this.file(this.fullPath(filepath)).exists())[0];
	}

	async move(src: string, dest: string) {
		await this.file(this.fullPath(src)).move(this.file(this.fullPath(dest)));
	}

	async copy(src: string, dest: string) {
		await this.file(this.fullPath(src)).copy(this.file(this.fullPath(dest)));
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

	get tusExtensions() {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(filepath: string, context: ChunkedUploadContext) {
		const file = this.file(this.fullPath(filepath));

		const [uri] = await file.createResumableUpload();

		context.metadata!['uri'] = uri;

		return context;
	}

	async writeChunk(filepath: string, content: Readable, offset: number, context: ChunkedUploadContext) {
		const file = this.file(this.fullPath(filepath));

		const stream = file.createWriteStream({
			chunkSize: this.preferredChunkSize,
			uri: context.metadata!['uri'] as string,
			offset,
			isPartialUpload: true,
			resumeCRC32C: context.metadata!['hash'] as string,
			metadata: {
				contentLength: context.size || 0,
			},
		});

		stream.on('crc32c', (hash: string) => {
			context.metadata!['hash'] = hash;
		});

		let bytesUploaded = offset || 0;

		content.on('data', (chunk: Buffer) => {
			bytesUploaded += chunk.length;
		});

		await pipeline(content, stream);

		return bytesUploaded;
	}

	async finishChunkedUpload(_filepath: string, _context: ChunkedUploadContext) {}

	async deleteChunkedUpload(filepath: string, _context: ChunkedUploadContext) {
		await this.delete(filepath);
	}
}

export default DriverGCS;
