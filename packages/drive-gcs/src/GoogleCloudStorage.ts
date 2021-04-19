import {
	Storage as GCSDriver,
	StorageOptions,
	Bucket,
	File,
	GetFilesOptions,
	GetFilesResponse,
} from '@google-cloud/storage';
import {
	Storage,
	isReadableStream,
	pipeline,
	Response,
	ExistsResponse,
	ContentResponse,
	SignedUrlResponse,
	SignedUrlOptions,
	StatResponse,
	FileListResponse,
	DeleteResponse,
	FileNotFound,
	PermissionMissing,
	UnknownException,
	AuthorizationRequired,
	WrongKeyPath,
	Range,
} from '@directus/drive';

import path from 'path';

import normalize from 'normalize-path';

function handleError(err: Error & { code?: number | string }, path: string): Error {
	switch (err.code) {
		case 401:
			return new AuthorizationRequired(err, path);
		case 403:
			return new PermissionMissing(err, path);
		case 404:
			return new FileNotFound(err, path);
		case 'ENOENT':
			return new WrongKeyPath(err, path);
		default:
			return new UnknownException(err, String(err.code), path);
	}
}

export class GoogleCloudStorage extends Storage {
	protected $config: GoogleCloudStorageConfig;
	protected $driver: GCSDriver;
	protected $bucket: Bucket;
	protected $root: string;

	public constructor(config: GoogleCloudStorageConfig) {
		super();
		this.$config = config;
		const GCSStorage = require('@google-cloud/storage').Storage;
		this.$driver = new GCSStorage(config);
		this.$bucket = this.$driver.bucket(config.bucket);
		this.$root = config.root ? normalize(config.root).replace(/^\//, '') : '';
	}

	/**
	 * Prefixes the given filePath with the storage root location
	 */
	protected _fullPath(filePath: string) {
		return normalize(path.join(this.$root, filePath));
	}

	private _file(filePath: string): File {
		return this.$bucket.file(this._fullPath(filePath));
	}

	/**
	 * Copy a file to a location.
	 */
	public async copy(src: string, dest: string): Promise<Response> {
		const srcFile = this._file(src);
		const destFile = this._file(dest);

		try {
			const result = await srcFile.copy(destFile);
			return { raw: result };
		} catch (e) {
			throw handleError(e, src);
		}
	}

	/**
	 * Delete existing file.
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		try {
			const result = await this._file(location).delete();
			return { raw: result, wasDeleted: true };
		} catch (e) {
			e = handleError(e, location);

			if (e instanceof FileNotFound) {
				return { raw: undefined, wasDeleted: false };
			}

			throw e;
		}
	}

	/**
	 * Returns the driver.
	 */
	public driver(): GCSDriver {
		return this.$driver;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		try {
			const result = await this._file(location).exists();
			return { exists: result[0], raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents.
	 */

	public async get(location: string, encoding: BufferEncoding = 'utf-8'): Promise<ContentResponse<string>> {
		try {
			const result = await this._file(location).download();
			return { content: result[0].toString(encoding), raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the file contents as Buffer.
	 */
	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		try {
			const result = await this._file(location).download();
			return { content: result[0], raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns signed url for an existing file.
	 */
	public async getSignedUrl(location: string, options: SignedUrlOptions = {}): Promise<SignedUrlResponse> {
		const { expiry = 900 } = options;
		try {
			const result = await this._file(location).getSignedUrl({
				action: 'read',
				expires: Date.now() + expiry * 1000,
			});
			return { signedUrl: result[0], raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns file's size and modification date.
	 */
	public async getStat(location: string): Promise<StatResponse> {
		try {
			const result = await this._file(location).getMetadata();
			return {
				size: Number(result[0].size),
				modified: new Date(result[0].updated),
				raw: result,
			};
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Returns the stream for the given file.
	 */
	public getStream(location: string, range?: Range): NodeJS.ReadableStream {
		return this._file(location).createReadStream({ start: range?.start, end: range?.end });
	}

	/**
	 * Returns URL for a given location. Note this method doesn't
	 * validates the existence of file or it's visibility
	 * status.
	 */
	public getUrl(location: string): string {
		return `https://storage.googleapis.com/${this.$bucket.name}/${this._fullPath(location)}`;
	}

	/**
	 * Move file to a new location.
	 */
	public async move(src: string, dest: string): Promise<Response> {
		const srcFile = this._file(src);
		const destFile = this._file(dest);

		try {
			const result = await srcFile.move(destFile);
			return { raw: result };
		} catch (e) {
			throw handleError(e, src);
		}
	}

	/**
	 * Creates a new file.
	 * This method will create missing directories on the fly.
	 */
	public async put(location: string, content: Buffer | NodeJS.ReadableStream | string): Promise<Response> {
		const file = this._file(location);

		try {
			if (isReadableStream(content)) {
				const destStream = file.createWriteStream();
				await pipeline(content, destStream);
				return { raw: undefined };
			}

			const result = await file.save(content, { resumable: false });
			return { raw: result };
		} catch (e) {
			throw handleError(e, location);
		}
	}

	/**
	 * Iterate over all files in the bucket.
	 */
	public async *flatList(prefix = ''): AsyncIterable<FileListResponse> {
		prefix = this._fullPath(prefix);

		let nextQuery: GetFilesOptions | undefined = {
			prefix,
			autoPaginate: false,
			maxResults: 1000,
		};

		do {
			try {
				const result = (await this.$bucket.getFiles(nextQuery)) as GetFilesResponse;

				nextQuery = result[1];
				for (const file of result[0]) {
					yield {
						raw: file.metadata,
						path: file.name.substring(this.$root.length),
					};
				}
			} catch (e) {
				throw handleError(e, prefix);
			}
		} while (nextQuery);
	}
}

export interface GoogleCloudStorageConfig extends StorageOptions {
	bucket: string;
	root?: string;
}
