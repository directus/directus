import S3, { ClientConfiguration, ObjectList } from 'aws-sdk/clients/s3';
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
	Range,
} from '@directus/drive';

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

export class AmazonWebServicesS3Storage extends Storage {
	protected $driver: S3;
	protected $bucket: string;

	constructor(config: AmazonWebServicesS3StorageConfig) {
		super();
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const S3 = require('aws-sdk/clients/s3');

		this.$driver = new S3({
			accessKeyId: config.key,
			secretAccessKey: config.secret,
			...config,
		});

		this.$bucket = config.bucket;
	}

	/**
	 * Copy a file to a location.
	 */
	public async copy(src: string, dest: string): Promise<Response> {
		const params = {
			Key: dest,
			Bucket: this.$bucket,
			CopySource: `/${this.$bucket}/${src}`,
		};

		try {
			const result = await this.$driver.copyObject(params).promise();
			return { raw: result };
		} catch (e) {
			throw handleError(e, src, this.$bucket);
		}
	}

	/**
	 * Delete existing file.
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.deleteObject(params).promise();
			// Amazon does not inform the client if anything was deleted.
			return { raw: result, wasDeleted: null };
		} catch (e) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns the driver.
	 */
	public driver(): S3 {
		return this.$driver;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.headObject(params).promise();
			return { exists: true, raw: result };
		} catch (e) {
			if (e.statusCode === 404) {
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
		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.getObject(params).promise();

			// S3.getObject returns a Buffer in Node.js
			const body = result.Body as Buffer;

			return { content: body, raw: result };
		} catch (e) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns signed url for an existing file
	 */
	public async getSignedUrl(location: string, options: SignedUrlOptions = {}): Promise<SignedUrlResponse> {
		const { expiry = 900 } = options;

		try {
			const params = {
				Key: location,
				Bucket: this.$bucket,
				Expires: expiry,
			};

			const result = await this.$driver.getSignedUrlPromise('getObject', params);
			return { signedUrl: result, raw: result };
		} catch (e) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns file's size and modification date.
	 */
	public async getStat(location: string): Promise<StatResponse> {
		const params = { Key: location, Bucket: this.$bucket };

		try {
			const result = await this.$driver.headObject(params).promise();
			return {
				size: result.ContentLength as number,
				modified: result.LastModified as Date,
				raw: result,
			};
		} catch (e) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns the stream for the given file.
	 */
	public getStream(location: string, range?: Range): NodeJS.ReadableStream {
		const params: S3.GetObjectRequest = {
			Key: location,
			Bucket: this.$bucket,
			Range: range ? `${range.start}-${range.end || ''}` : undefined,
		};
		return this.$driver.getObject(params).createReadStream();
	}

	/**
	 * Returns url for a given key.
	 */
	public getUrl(location: string): string {
		const { href } = this.$driver.endpoint;

		if (href.startsWith('https://s3.amazonaws')) {
			return `https://${this.$bucket}.s3.amazonaws.com/${location}`;
		}

		return `${href}${this.$bucket}/${location}`;
	}

	/**
	 * Moves file from one location to another. This
	 * method will call `copy` and `delete` under
	 * the hood.
	 */
	public async move(src: string, dest: string): Promise<Response> {
		await this.copy(src, dest);
		await this.delete(src);
		return { raw: undefined };
	}

	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 */
	public async put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response> {
		const params = { Key: location, Body: content, Bucket: this.$bucket };
		try {
			const result = await this.$driver.upload(params).promise();
			return { raw: result };
		} catch (e) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Iterate over all files in the bucket.
	 */
	public async *flatList(prefix = ''): AsyncIterable<FileListResponse> {
		let continuationToken: string | undefined;

		do {
			try {
				const response = await this.$driver
					.listObjectsV2({
						Bucket: this.$bucket,
						Prefix: prefix,
						ContinuationToken: continuationToken,
						MaxKeys: 1000,
					})
					.promise();

				continuationToken = response.NextContinuationToken;

				for (const file of response.Contents as ObjectList) {
					yield {
						raw: file,
						path: file.Key as string,
					};
				}
			} catch (e) {
				throw handleError(e, prefix, this.$bucket);
			}
		} while (continuationToken);
	}
}

export interface AmazonWebServicesS3StorageConfig extends ClientConfiguration {
	key: string;
	secret: string;
	bucket: string;
}
