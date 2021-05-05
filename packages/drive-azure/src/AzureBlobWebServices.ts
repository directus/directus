import {
	Storage,
	UnknownException,
	FileNotFound,
	SignedUrlOptions,
	Response,
	ExistsResponse,
	ContentResponse,
	SignedUrlResponse,
	StatResponse,
	FileListResponse,
	DeleteResponse,
	isReadableStream,
	Range,
} from '@directus/drive';

import {
	BlobServiceClient,
	ContainerClient,
	StorageSharedKeyCredential,
	generateBlobSASQueryParameters,
	ContainerSASPermissions,
} from '@azure/storage-blob';

import path from 'path';

import { PassThrough, Readable } from 'stream';

import normalize from 'normalize-path';

function handleError(err: Error, path: string): Error {
	return new UnknownException(err, err.name, path);
}

export class AzureBlobWebServicesStorage extends Storage {
	protected $client: BlobServiceClient;
	protected $containerClient: ContainerClient;
	protected $signedCredentials: StorageSharedKeyCredential;
	protected $root: string;

	constructor(config: AzureBlobWebServicesStorageConfig) {
		super();

		this.$signedCredentials = new StorageSharedKeyCredential(config.accountName, config.accountKey);
		this.$client = new BlobServiceClient(
			config.endpoint ?? `https://${config.accountName}.blob.core.windows.net`,
			this.$signedCredentials
		);
		this.$containerClient = this.$client.getContainerClient(config.containerName);
		this.$root = config.root ? normalize(config.root).replace(/^\//, '') : '';
	}

	/**
	 * Prefixes the given filePath with the storage root location
	 */
	protected _fullPath(filePath: string): string {
		return normalize(path.join(this.$root, filePath));
	}

	public async copy(src: string, dest: string): Promise<Response> {
		src = this._fullPath(src);
		dest = this._fullPath(dest);

		try {
			const source = this.$containerClient.getBlockBlobClient(src);
			const target = this.$containerClient.getBlockBlobClient(dest);

			const poller = await target.beginCopyFromURL(source.url);
			const result = await poller.pollUntilDone();

			return { raw: result };
		} catch (e) {
			throw handleError(e, src);
		}
	}

	public async delete(location: string): Promise<DeleteResponse> {
		location = this._fullPath(location);

		try {
			const result = await this.$containerClient.getBlockBlobClient(location).deleteIfExists();
			return { raw: result, wasDeleted: result.succeeded };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public driver(): BlobServiceClient {
		return this.$client;
	}

	public async exists(location: string): Promise<ExistsResponse> {
		location = this._fullPath(location);

		try {
			const result = await this.$containerClient.getBlockBlobClient(location).exists();
			return { exists: result, raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public async get(location: string, encoding: BufferEncoding = 'utf-8'): Promise<ContentResponse<string>> {
		location = this._fullPath(location);

		try {
			const bufferResult = await this.getBuffer(location);
			return {
				content: bufferResult.content.toString(encoding),
				raw: bufferResult.raw,
			};
		} catch (e) {
			throw new FileNotFound(e, location);
		}
	}

	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		location = this._fullPath(location);

		try {
			const client = this.$containerClient.getBlobClient(location);
			return { content: await client.downloadToBuffer(), raw: client };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public async getSignedUrl(location: string, options: SignedUrlOptions = {}): Promise<SignedUrlResponse> {
		location = this._fullPath(location);

		const { expiry = 900 } = options;

		try {
			const client = this.$containerClient.getBlobClient(location);
			const blobSAS = generateBlobSASQueryParameters(
				{
					containerName: this.$containerClient.containerName,
					blobName: location,
					permissions: ContainerSASPermissions.parse('racwdl'),
					startsOn: new Date(),
					expiresOn: new Date(new Date().valueOf() + expiry),
				},
				this.$signedCredentials
			).toString();

			const sasUrl = client.url + '?' + blobSAS;
			return { signedUrl: sasUrl, raw: client };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public async getStat(location: string): Promise<StatResponse> {
		location = this._fullPath(location);

		try {
			const props = await this.$containerClient.getBlobClient(location).getProperties();
			return {
				size: props.contentLength as number,
				modified: props.lastModified as Date,
				raw: props,
			};
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public getStream(location: string, range?: Range): NodeJS.ReadableStream {
		location = this._fullPath(location);

		const intermediateStream = new PassThrough({ highWaterMark: 1 });

		const stream = this.$containerClient
			.getBlobClient(location)
			.download(range?.start, range?.end ? range.end - range.start : undefined);

		try {
			stream
				.then((result) => result.readableStreamBody)
				.then((stream) => {
					if (!stream) {
						throw handleError(new Error('Blobclient stream was not available'), location);
					}

					stream.pipe(intermediateStream);
				})
				.catch((error) => {
					intermediateStream.emit('error', error);
				});
		} catch (error) {
			intermediateStream.emit('error', error);
		}

		return intermediateStream;
	}

	public getUrl(location: string): string {
		location = this._fullPath(location);

		return this.$containerClient.getBlobClient(location).url;
	}

	public async move(src: string, dest: string): Promise<Response> {
		src = this._fullPath(src);
		dest = this._fullPath(dest);

		const source = this.$containerClient.getBlockBlobClient(src);
		const target = this.$containerClient.getBlockBlobClient(dest);

		const poller = await target.beginCopyFromURL(source.url);
		const result = await poller.pollUntilDone();

		await source.deleteIfExists();

		return { raw: result };
	}

	public async put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response> {
		location = this._fullPath(location);

		const blockBlobClient = this.$containerClient.getBlockBlobClient(location);

		try {
			if (isReadableStream(content)) {
				const result = await blockBlobClient.uploadStream(content as Readable);
				return { raw: result };
			}

			const result = await blockBlobClient.upload(content, content.length);
			return { raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	public async *flatList(prefix = ''): AsyncIterable<FileListResponse> {
		prefix = this._fullPath(prefix);

		try {
			const blobs = this.$containerClient.listBlobsFlat({
				prefix,
			});

			for await (const blob of blobs) {
				yield {
					raw: blob,
					path: (blob.name as string).substring(this.$root.length),
				};
			}
		} catch (e) {
			throw handleError(e, prefix);
		}
	}
}

export interface AzureBlobWebServicesStorageConfig {
	containerName: string;
	accountName: string;
	accountKey: string;
	endpoint?: string;
	root?: string;
}
