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
import path from 'path';
import normalize from 'normalize-path';

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
	protected $root: string;
	protected $acl: string;

	constructor(config: AmazonWebServicesS3StorageConfig) {
		super();
		const S3 = require('aws-sdk/clients/s3');

		this.$driver = new S3({
			accessKeyId: config.key,
			secretAccessKey: config.secret,
			...config,
		});

		this.$bucket = config.bucket;
		this.$root = config.root ? normalize(config.root).replace(/^\//, '') : '';
		this.$acl = config.acl ? config.acl : '';
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
		dest = this._fullPath(src);

		const params = {
			Key: dest,
			Bucket: this.$bucket,
			CopySource: `/${this.$bucket}/${src}`,
			ACL: this.$acl,
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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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
		location = this._fullPath(location);

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

		const params = {
			Key: location,
			Body: content,
			Bucket: this.$bucket,
			ACL: this.$acl,
			ContentType: type ? type : '',
		};

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
		prefix = this._fullPath(prefix);

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
					const path = file.Key as string;

					yield {
						raw: file,
						path: path.substring(this.$root.length),
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
	root?: string;
	acl?: string;
}
