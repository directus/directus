import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import type { TusDriver } from '@directus/storage';
import type { ChunkedUploadContext, ReadOptions } from '@directus/types';
import { normalizePath } from '@directus/utils';

const MAXIMUM_CHUNK_SIZE = 104_857_600; // 100mb

export type DriverAzureConfig = {
	containerName: string;
	accountName: string;
	accountKey: string;
	root?: string;
	endpoint?: string;
	tus?: {
		enabled: boolean;
		chunkSize?: number;
	};
};

export class DriverAzure implements TusDriver {
	private containerClient: ContainerClient;
	private signedCredentials: StorageSharedKeyCredential;
	private root: string;

	constructor(config: DriverAzureConfig) {
		this.signedCredentials = new StorageSharedKeyCredential(config.accountName, config.accountKey);

		const client = new BlobServiceClient(
			config.endpoint ?? `https://${config.accountName}.blob.core.windows.net`,
			this.signedCredentials,
		);

		this.containerClient = client.getContainerClient(config.containerName);
		this.root = config.root ? normalizePath(config.root, { removeLeading: true }) : '';

		// https://learn.microsoft.com/en-us/rest/api/storageservices/append-block?tabs=microsoft-entra-id#remarks
		if (config.tus?.enabled && config.tus.chunkSize && config.tus.chunkSize > MAXIMUM_CHUNK_SIZE) {
			throw new Error('Invalid chunkSize provided');
		}
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	async read(filepath: string, options?: ReadOptions) {
		const { range } = options || {};

		const { readableStreamBody } = await this.containerClient
			.getBlobClient(this.fullPath(filepath))
			.download(range?.start, range?.end ? range.end - (range.start || 0) + 1 : undefined);

		if (!readableStreamBody) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return readableStreamBody as Readable;
	}

	async write(filepath: string, content: Readable, type = 'application/octet-stream') {
		const blockBlobClient = this.containerClient.getBlockBlobClient(this.fullPath(filepath));

		await blockBlobClient.uploadStream(content as Readable, undefined, undefined, {
			blobHTTPHeaders: { blobContentType: type },
		});
	}

	async delete(filepath: string) {
		await this.containerClient.getBlockBlobClient(this.fullPath(filepath)).deleteIfExists();
	}

	async stat(filepath: string) {
		const props = await this.containerClient.getBlobClient(this.fullPath(filepath)).getProperties();

		return {
			size: props.contentLength as number,
			modified: props.lastModified as Date,
		};
	}

	async exists(filepath: string) {
		return await this.containerClient.getBlockBlobClient(this.fullPath(filepath)).exists();
	}

	async move(src: string, dest: string) {
		await this.copy(src, dest);
		await this.containerClient.getBlockBlobClient(this.fullPath(src)).deleteIfExists();
	}

	async copy(src: string, dest: string) {
		const source = this.containerClient.getBlockBlobClient(this.fullPath(src));
		const target = this.containerClient.getBlockBlobClient(this.fullPath(dest));

		const poller = await target.beginCopyFromURL(source.url);
		await poller.pollUntilDone();
	}

	async *list(prefix = '') {
		const blobs = this.containerClient.listBlobsFlat({
			prefix: this.fullPath(prefix),
		});

		for await (const blob of blobs) {
			yield (blob.name as string).substring(this.root.length);
		}
	}

	get tusExtensions() {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(filepath: string, context: ChunkedUploadContext) {
		await this.containerClient.getAppendBlobClient(this.fullPath(filepath)).createIfNotExists();

		return context;
	}

	async writeChunk(filepath: string, content: Readable, offset: number, _context: ChunkedUploadContext) {
		const client = this.containerClient.getAppendBlobClient(this.fullPath(filepath));

		let bytesUploaded = offset || 0;

		const chunks: Buffer[] = [];

		content.on('data', (chunk: Buffer) => {
			bytesUploaded += chunk.length;
			chunks.push(chunk);
		});

		await finished(content);

		const chunk = Buffer.concat(chunks);

		if (chunk.length > 0) {
			await client.appendBlock(chunk, chunk.length);
		}

		return bytesUploaded;
	}

	async finishChunkedUpload(_filepath: string, _context: ChunkedUploadContext) {}

	async deleteChunkedUpload(filepath: string, _context: ChunkedUploadContext) {
		await this.delete(filepath);
	}
}

export default DriverAzure;
