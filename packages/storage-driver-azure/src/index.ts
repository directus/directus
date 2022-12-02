import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import type { Driver, Range } from '@directus/storage';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

export type DriverAzureConfig = {
	containerName: string;
	accountName: string;
	accountKey: string;
	root?: string;
	endpoint?: string;
};

export class DriverAzure implements Driver {
	private client: BlobServiceClient;
	private containerClient: ContainerClient;
	private signedCredentials: StorageSharedKeyCredential;
	private root: string;

	constructor(config: DriverAzureConfig) {
		this.signedCredentials = new StorageSharedKeyCredential(config.accountName, config.accountKey);
		this.client = new BlobServiceClient(
			config.endpoint ?? `https://${config.accountName}.blob.core.windows.net`,
			this.signedCredentials
		);
		this.containerClient = this.client.getContainerClient(config.containerName);
		this.root = config.root ? normalizePath(config.root).replace(/^\//, '') : '';
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	async getStream(filepath: string, range?: Range) {
		const { readableStreamBody } = await this.containerClient
			.getBlobClient(this.fullPath(filepath))
			.download(range?.start, range?.end ? range.end - (range.start || 0) : undefined);

		if (!readableStreamBody) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return readableStreamBody;
	}

	async getBuffer(filepath: string) {
		const client = this.containerClient.getBlobClient(this.fullPath(filepath));
		return await client.downloadToBuffer();
	}

	async getStat(filepath: string) {
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
		const fullSrc = this.fullPath(src);
		const fullDest = this.fullPath(dest);

		const source = this.containerClient.getBlockBlobClient(fullSrc);
		const target = this.containerClient.getBlockBlobClient(fullDest);

		const poller = await target.beginCopyFromURL(source.url);
		await poller.pollUntilDone();

		await source.deleteIfExists();
	}

	async copy(src: string, dest: string) {
		const fullSrc = this.fullPath(src);
		const fullDest = this.fullPath(dest);

		const source = this.containerClient.getBlockBlobClient(fullSrc);
		const target = this.containerClient.getBlockBlobClient(fullDest);

		const poller = await target.beginCopyFromURL(source.url);
		await poller.pollUntilDone();
	}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type = 'application/octet-stream') {
		const blockBlobClient = this.containerClient.getBlockBlobClient(this.fullPath(filepath));

		if (isReadableStream(content)) {
			await blockBlobClient.uploadStream(content as Readable, undefined, undefined, {
				blobHTTPHeaders: { blobContentType: type },
			});
		} else {
			await blockBlobClient.upload(content, content.length);
		}
	}

	async delete(filepath: string) {
		await this.containerClient.getBlockBlobClient(this.fullPath(filepath)).deleteIfExists();
	}

	async *list(prefix = '') {
		const fullPrefix = this.fullPath(prefix);

		const blobs = this.containerClient.listBlobsFlat({
			prefix: fullPrefix,
		});

		for await (const blob of blobs) {
			yield (blob.name as string).substring(this.root.length);
		}
	}
}

export default DriverAzure;
