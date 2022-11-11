import {
	S3Client,
	CopyObjectCommand,
	DeleteObjectCommand,
	S3ClientConfig,
	HeadObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
	ListObjectsV2Command,
	_Object,
	HeadObjectCommandInput,
	PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import {
	Storage,
	UnknownException,
	NoSuchBucket,
	FileNotFound,
	PermissionMissing,
	SignedUrlOptions,
	Response,
	ExistsResponse,
	ContentResponse,
	SignedUrlResponse,
	StatResponse,
	FileListResponse,
	DeleteResponse,
} from '@directus/drive';
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

import path from 'path';
import normalize from 'normalize-path';
import { PassThrough } from 'stream';

function handleError(err: Error, path: string, bucket: string): Error {
	switch (err.name) {
		case 'NoSuchBucket':
			return new NoSuchBucket(err, bucket);
		case 'NoSuchKey':
			return new FileNotFound(err, path);
		case 'AllAccessDisabled':
			return new PermissionMissing(err, path);
		default:
			return new UnknownException(err, err.name, path);
	}
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
	const chunks: Buffer[] = [];
	return new Promise((resolve, reject) => {
		stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
		stream.on('error', (err) => reject(err));
		stream.on('end', () => resolve(Buffer.concat(chunks)));
	});
}

export class AmazonWebServicesS3Storage extends Storage {
	protected $driver: S3Client;
	protected $bucket: string;
	protected $root: string;
	protected $acl?: string;
	protected $serverSideEncryption?: string;

	constructor(config: AmazonWebServicesS3StorageConfig) {
		super();
		const { S3Client } = require('@aws-sdk/client-s3');

		this.$driver = new S3Client({
			credentials: {
				accessKeyId: config.key,
				secretAccessKey: config.secret,
			},
		});

		this.$bucket = config.bucket;
		this.$root = config.root ? normalize(config.root).replace(/^\//, '') : '';
		this.$acl = config.acl;
		this.$serverSideEncryption = config.serverSideEncryption;
	}

	/**
	 * Prefixes the given filePath with the storage root location
	 */
	protected _fullPath(filePath: string): string {
		return normalize(path.join(this.$root, filePath));
	}

	/**
	 * Copy a file to a location.
	 */
	public async copy(src: string, dest: string): Promise<Response> {
		src = this._fullPath(src);
		dest = this._fullPath(dest);

		const params = {
			Key: dest,
			Bucket: this.$bucket,
			CopySource: `/${this.$bucket}/${src}`,
			ACL: this.$acl,
			ServerSideEncryption: this.$serverSideEncryption,
		};

		try {
			const result = await this.$driver.send(new CopyObjectCommand(params));
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, src, this.$bucket);
		}
	}

	/**
	 * Delete existing file.
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		location = this._fullPath(location);

		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.send(new DeleteObjectCommand(params));
			// Amazon does not inform the client if anything was deleted.
			return { raw: result, wasDeleted: null };
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns the driver.
	 */
	public driver(): S3Client {
		return this.$driver;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		location = this._fullPath(location);
		const params: HeadObjectCommandInput = { Key: location, Bucket: this.$bucket };
		try {
			const result = await this.$driver.send(new HeadObjectCommand(params));
			return { exists: true, raw: result };
		} catch (e: any) {
			if (e.$metadata.httpStatusCode === 404) {
				return { exists: false, raw: e };
			} else {
				throw handleError(e, location, this.$bucket);
			}
		}
	}

	/**
	 * Returns the file contents.
	 */
	public async get(location: string, encoding: BufferEncoding = 'utf-8'): Promise<ContentResponse<string>> {
		const bufferResult = await this.getBuffer(location);

		return {
			content: bufferResult.content.toString(encoding),
			raw: bufferResult.raw,
		};
	}

	/**
	 * Returns the file contents as Buffer.
	 */
	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		location = this._fullPath(location);

		const params = { Key: location, Bucket: this.$bucket };
		const result = await this.$driver.send(new GetObjectCommand(params));
		const body = result.Body as NodeJS.ReadableStream;
		try {
			const content = await streamToBuffer(body);
			return { content, raw: result };
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns signed url for an existing file
	 */
	public async getSignedUrl(location: string, options: SignedUrlOptions = {}): Promise<SignedUrlResponse> {
		location = this._fullPath(location);

		const { expiry = 900 } = options;

		try {
			const params = {
				Key: location,
				Bucket: this.$bucket,
				Expires: expiry,
			};
			const command = new GetObjectCommand(params);
			const result = await getSignedUrl(this.$driver, command, { expiresIn: expiry });
			return { signedUrl: result, raw: result };
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns file's size and modification date.
	 */
	public async getStat(location: string): Promise<StatResponse> {
		location = this._fullPath(location);

		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.send(new HeadObjectCommand(params));

			return {
				size: result.ContentLength as number,
				modified: result.LastModified as Date,
				raw: result,
			};
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns the stream for the given file.
	 */
	public getStream(location: string, range: any): NodeJS.ReadableStream {
		location = this._fullPath(location);
		const intermediateStream = new PassThrough({ highWaterMark: 1 });

		const params = {
			Key: location,
			Bucket: this.$bucket,
			Range: range ? `bytes=${range.start}-${range.end || ''}` : undefined,
		};
		this.$driver.send(new GetObjectCommand(params)).then((result) => {
			const stream = result.Body as NodeJS.ReadableStream;
			stream.pipe(intermediateStream);
		});

		return intermediateStream;
	}

	/**
	 * Returns url for a given key.
	 */
	public getUrl(location: string): string {
		location = this._fullPath(location);

		const endpoint = this.$driver.config.endpointProvider({});

		if (endpoint.url.href.startsWith('https://s3.amazonaws')) {
			return `https://${this.$bucket}.s3.amazonaws.com/${location}`;
		}

		return `${endpoint.url.href}${this.$bucket}/${location}`;
	}

	/**
	 * Moves file from one location to another. This
	 * method will call `copy` and `delete` under
	 * the hood.
	 */
	public async move(src: string, dest: string): Promise<Response> {
		src = this._fullPath(src);
		dest = this._fullPath(dest);

		await this.copy(src, dest);
		await this.delete(src);
		return { raw: undefined };
	}

	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 */
	public async put(
		location: string,
		content: Buffer | NodeJS.ReadableStream | string,
		type?: string
	): Promise<Response> {
		location = this._fullPath(location);
		let body;
		if (Buffer.isBuffer(content) || typeof content == 'string') {
			body = content;
		} else {
			body = await streamToBuffer(content);
		}

		const params: PutObjectCommandInput = {
			Key: location,
			Body: body,
			Bucket: this.$bucket,
			ACL: this.$acl,
			ContentType: type ? type : '',
			ServerSideEncryption: this.$serverSideEncryption,
		};
		try {
			const result = await this.$driver.send(new PutObjectCommand(params));
			return { raw: result };
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Iterate over all files in the bucket.
	 */
	public async *flatList(prefix = ''): AsyncIterable<FileListResponse> {
		prefix = this._fullPath(prefix);

		let continuationToken: string | undefined;

		do {
			try {
				const response = await this.$driver.send(
					new ListObjectsV2Command({
						Bucket: this.$bucket,
						Prefix: prefix,
						ContinuationToken: continuationToken,
						MaxKeys: 1000,
					})
				);

				continuationToken = response.NextContinuationToken;
				if (response.Contents) {
					for (const file of response.Contents) {
						const path = file.Key as string;

						yield {
							raw: file,
							path: path.substring(this.$root.length),
						};
					}
				}
			} catch (e: any) {
				throw handleError(e, prefix, this.$bucket);
			}
		} while (continuationToken);
	}
}

export interface AmazonWebServicesS3StorageConfig extends S3ClientConfig {
	key: string;
	secret: string;
	bucket: string;
	root?: string;
	acl?: string;
	serverSideEncryption?: string;
}
