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
} from '@directus/drive';
import { StorageClient } from '@supabase/storage-js';
import { IncomingHttpHeaders, request } from 'node:http';
import { Duplex } from 'node:stream';

export class SupabaseStorage extends Storage {
	private apiClient;
	private bucket: string;
	private endpoint: string;
	private secret;

	constructor({ endpoint, bucket, secret }: SupabaseStorageConfig) {
		super();

		this.endpoint = endpoint;
		this.bucket = bucket;
		this.secret = secret;
		this.apiClient = new StorageClient(endpoint, {
			apikey: secret,
			Authorization: `Bearer ${secret}`,
		}).from(bucket);
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
		const { data: raw, error } = await this.apiClient.upload(path, content, { contentType });
		if (error) {
			throw new UnknownException(error, error.name, path);
		}
		return { raw };
	}

	/**
	 * Delete an existing file
	 * @param location filename
	 */
	public async delete(location: string): Promise<DeleteResponse> {
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
	private getHead(path: string): Promise<IncomingHttpHeaders> {
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
					if (statusCode !== 200) {
						const err = new Error(res.statusMessage);
						err.name = '' + statusCode;
						reject(new FileNotFound(err, path));
					}
					resolve(res.headers);
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
			const headers = await this.getHead(path);
			return {
				size: parseInt(headers['content-length'] || ''),
				modified: new Date(headers['last-modified'] || ''),
				raw: headers,
			};
		} catch (error: any) {
			if (error instanceof FileNotFound) {
				throw error;
			}
			throw new UnknownException(error, error.name, path);
		}
	}

	/**
	 * Determines if a file already exists.
	 * @param location filename
	 */
	public async exists(location: string): Promise<ExistsResponse> {
		try {
			const { raw } = await this.getStat(location);
			return {
				exists: true,
				raw,
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
	public getStream(location: string, _range?: Range | undefined): NodeJS.ReadableStream {
		const promise = this.apiClient
			.download(location)
			.then(({ data }) => data?.arrayBuffer())
			.then((data) => Buffer.from(data!))
			.catch((error) => {
				throw new UnknownException(error, error.name, location);
			});
		return Duplex.from(promise);
	}

	/**
	 * Returns the file contents as a Buffer.
	 * @param location filename
	 */
	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		const { data: raw, error } = await this.apiClient.download(location);
		if (error) {
			throw new UnknownException(error, error.name, location);
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
		const limit = 1000;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data: items, error } = await this.apiClient.list(undefined, { limit, offset, search: prefix });
			if (error) {
				throw new UnknownException(error, error.name, prefix ?? '');
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
}
