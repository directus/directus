import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
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
	private containerClient: ContainerClient;
	private signedCredentials: StorageSharedKeyCredential;
	private root: string;

	constructor(config: DriverAzureConfig) {
		this.signedCredentials = new StorageSharedKeyCredential(config.accountName, config.accountKey);

		const client = new BlobServiceClient(
			config.endpoint ?? `https://${config.accountName}.blob.core.windows.net`,
			this.signedCredentials
		);

		this.containerClient = client.getContainerClient(config.containerName);
		this.root = config.root ? normalizePath(config.root, { removeLeading: true }) : '';
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	async read(filepath: string, range?: Range) {
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
}

export default DriverAzure;
