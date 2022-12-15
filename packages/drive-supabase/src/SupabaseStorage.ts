import {
	Storage,
	UnknownException,
	FileNotFound,
	Response,
	DeleteResponse,
	ExistsResponse,
	Range,
	ContentResponse,
	StatResponse,
	FileListResponse,
	NoSuchBucket,
	PermissionMissing,
} from '@directus/drive';
import { StorageClient } from '@supabase/storage-js';
import { IncomingHttpHeaders, OutgoingHttpHeaders, request } from 'node:http';
import { PassThrough } from 'node:stream';
import { withBase } from 'ufo';

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
	private apiClient;
	private bucket: string;
	private endpoint: string;
	private secret;
	private root;

	constructor(config: SupabaseStorageConfig) {
		super();

		const { endpoint, bucket, secret, root } = config;
		this.endpoint = endpoint;
		this.bucket = bucket;
		this.secret = secret;
		this.root = root;
		this.apiClient = new StorageClient(endpoint, {
			apikey: secret,
			Authorization: `Bearer ${secret}`,
		}).from(bucket);
	}

	private withRoot(path: string) {
		return withBase(path, this.root ?? '');
	}

	/**
	 * Upload a new file
	 * @param path filename
	 * @param content file content
	 * @param contentType file mime type
	 */
	public async put(
		path: string,
		content: string | Buffer | NodeJS.ReadableStream,
		contentType?: string | undefined
	): Promise<Response> {
		path = this.withRoot(path);
		const { data: raw, error } = await this.apiClient.upload(path, content, { contentType });
		if (error) {
			throw handleError(error, path, this.bucket);
		}
		return { raw };
	}

	/**
	 * Delete an existing file
	 * @param location filename
	 */
	public async delete(location: string): Promise<DeleteResponse> {
		location = this.withRoot(location);
		const { data: raw, error } = await this.apiClient.remove([location]);
		if (error) {
			return { raw: null, wasDeleted: false };
		}
		return { raw, wasDeleted: true };
	}

	/**
	 * Returns file's metadata
	 * @param path filename
	 */
	private head(path: string): Promise<IncomingHttpHeaders> {
		path = this.withRoot(path);
		return new Promise((resolve, reject) => {
			const req = request(
				`${this.endpoint}/object/authenticated/${this.bucket}/${path}`,
				{
					method: 'HEAD',
					headers: {
						Authorization: `Bearer ${this.secret}`,
					},
				},
				(res) => {
					const { statusCode } = res;
					if (statusCode === 200) {
						resolve(res.headers);
					}
					if (statusCode === 404) {
						const err = new Error(res.statusMessage);
						err.name = 'NoSuchKey';
						reject(err);
					}
					reject(new Error(res.statusMessage));
				}
			);
			req.on('error', (e) => {
				reject(e);
			});
			req.end();
		});
	}

	/**
	 * Returns file's size and modification date.
	 * @param path filename
	 */
	public async getStat(path: string): Promise<StatResponse> {
		try {
			const headers = await this.head(path);
			return {
				size: parseInt(headers['content-length'] || ''),
				modified: new Date(headers['last-modified'] || ''),
				raw: headers,
			};
		} catch (error: any) {
			throw handleError(error, path, this.bucket);
		}
	}

	/**
	 * Determines if a file already exists.
	 * @param location filename
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		try {
			const headers = await this.head(location);
			return {
				exists: true,
				raw: headers,
			};
		} catch (error) {
			return {
				exists: false,
				raw: null,
			};
		}
	}

	/**
	 * Returns the file contents as a Stream.
	 * @param location filename
	 * @param _range bytes to stream. Unused in this adapter
	 */
	public getStream(location: string, range?: Range | undefined): NodeJS.ReadableStream {
		location = this.withRoot(location);
		const intermediateStream = new PassThrough({ highWaterMark: 1 });

		const headers: OutgoingHttpHeaders = { Authorization: `Bearer ${this.secret}` };
		if (range) {
			headers.range = `bytes=${range.start}-${range.end}`;
		}
		const req = request(
			`${this.endpoint}/object/authenticated/${this.bucket}/${location}`,
			{
				method: 'GET',
				headers,
			},
			(res) => res.pipe(intermediateStream)
		);
		req.on('error', (err) => intermediateStream.emit('error', err));
		req.end();

		return intermediateStream;
	}

	/**
	 * Returns the file contents as a Buffer.
	 * @param location filename
	 */
	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		location = this.withRoot(location);
		const { data: raw, error } = await this.apiClient.download(location);
		if (error) {
			throw handleError(error, location, this.bucket);
		}
		const buffer = await raw.arrayBuffer();

		return {
			content: Buffer.from(buffer),
			raw,
		};
	}

	/**
	 * List files with a given prefix
	 * @param prefix [partial] filename
	 */
	public async *flatList(prefix?: string | undefined): AsyncIterable<FileListResponse> {
		const limit = 100;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data: items, error } = await this.apiClient.list(this.root, { limit, offset, search: prefix });
			if (error) {
				throw handleError(error, prefix ?? '', this.bucket);
			}

			itemCount = items.length;
			offset += itemCount;

			for (const item of items) {
				yield {
					raw: item,
					path: item.name,
				};
			}
		} while (itemCount === limit);
	}
}

export interface SupabaseStorageConfig {
	endpoint: string;
	bucket: string;
	secret: string;
	root?: string;
}
