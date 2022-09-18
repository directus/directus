import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClientOptions } from '@supabase/supabase-js';
import axios from 'axios';
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

export class SupabaseStorage extends Storage {
	protected $baseUrl: string;
	protected $client: SupabaseClient;
	protected $bucket: string;
	protected $root: string;

	constructor(config: SupabaseStorageConfig) {
		super();

		this.$baseUrl = config.url.replace(/\/$/, '') + `/storage/v1/object/public/${config.bucket}/`;
		this.$client = createClient(config.url, config.key, config.options);
		this.$bucket = config.bucket;
		this.$root = config.root ? normalize(config.root).replace(/^\//, '') : '';
		this.$root = this.$root.length > 0 ? this.$root.replace(/\/$/, '') + '/' : '';
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

		const { data, error } = await this.$client.storage.from(this.$bucket).copy(src, dest);
		if (error) {
			throw handleError(error, src, this.$bucket);
		}

		return {
			raw: data,
		};
	}

	/**
	 * Delete existing file.
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		location = this._fullPath(location);

		const { data, error } = await this.$client.storage.from(this.$bucket).remove([location]);
		if (error) {
			throw handleError(error, location, this.$bucket);
		}

		return {
			raw: data,
			wasDeleted: true,
		};
	}

	/**
	 * Returns the driver.
	 */
	public driver(): SupabaseClient {
		return this.$client;
	}

	/**
	 * Determines if a file or folder already exists.
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		location = this._fullPath(location);
		const url = await this.$client.storage.from(this.$bucket).createSignedUrl(location, 500);

		try {
			const result = await axios(url.data!.signedURL, {
				method: 'HEAD',
				validateStatus: (status) => status >= 200 && status < 300,
			});

			return { exists: true, raw: result.data };
		} catch (e: any) {
			return { exists: false, raw: e };
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

		const url = await this.$client.storage.from(this.$bucket).createSignedUrl(location, 10);

		try {
			const result = await axios(url.data!.signedURL, {
				validateStatus: (status) => status >= 200 && status < 300,
				responseType: 'arraybuffer',
			});

			const buffer = Buffer.from(result.data);
			return { content: buffer, raw: result };
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

		const result = await this.$client.storage.from(this.$bucket).createSignedUrl(location, expiry);

		return { signedUrl: result.data!.signedURL, raw: result };
	}

	/**
	 * Returns file's size and modification date.
	 */
	public async getStat(location: string): Promise<StatResponse> {
		location = this._fullPath(location);
		const url = await this.$client.storage.from(this.$bucket).createSignedUrl(location, 10);

		try {
			const result = await axios(url.data!.signedURL, {
				method: 'HEAD',
				validateStatus: (status) => status >= 200 && status < 300,
			});

			return {
				size: parseInt(result.headers['content-length']!),
				modified: new Date(result.headers['last-modified']!),
				raw: result,
			};
		} catch (e: any) {
			throw handleError(e, location, this.$bucket);
		}
	}

	/**
	 * Returns the stream for the given file.
	 */
	public getStream(location: string, range?: Range): NodeJS.ReadableStream {
		const intermediateStream = new PassThrough({ highWaterMark: 1 });

		(async (): Promise<NodeJS.ReadableStream> => {
			location = this._fullPath(location);
			const url = await this.$client.storage.from(this.$bucket).createSignedUrl(location, 10);

			try {
				const result = await axios(url.data!.signedURL, {
					headers: range ? { range: `bytes=${range.start}-${range.end}` } : {},
					responseType: 'stream',
					validateStatus: (status) => status >= 200 && status < 300,
				});

				return result.data;
			} catch (e: any) {
				throw handleError(e, location, this.$bucket);
			}
		})()
			.then((stream) => {
				stream.pipe(intermediateStream);
			})
			.catch((e) => {
				intermediateStream.emit('error', e);
			});

		return intermediateStream;
	}

	/**
	 * Returns url for a given key.
	 */
	public getUrl(location: string): string {
		location = this._fullPath(location);
		const { publicURL, error } = this.$client.storage.from(this.$bucket).getPublicUrl(location);

		if (error) {
			throw handleError(error, location, this.$bucket);
		}

		return publicURL!;
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

		const { data, error } = await this.$client.storage.from(this.$bucket).upload(location, content, {
			contentType: type ? type : '',
		});

		if (error) {
			throw handleError(error, location, this.$bucket);
		}

		return { raw: data };
	}

	/**
	 * Iterate over all files in the bucket.
	 */
	public async *flatList(prefix = ''): AsyncIterable<FileListResponse> {
		let offset = 0;
		while (true) {
			const { data, error } = await this.$client.storage.from(this.$bucket).list(this.$root, {
				limit: 100,
				offset: offset,
				search: prefix,
			});

			if (error) {
				throw handleError(error, prefix, this.$bucket);
			}

			if (!data) {
				break;
			}

			for (const file of data) {
				yield {
					raw: file,
					path: file.name,
				};
			}

			if (data.length < 100) {
				break;
			}

			offset += 100;
		}
	}
}

export interface SupabaseStorageConfig {
	url: string;
	key: string;
	bucket: string;
	root?: string;
	options?: SupabaseClientOptions;
}
