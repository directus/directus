import {
	Storage,
	UnknownException,
	FileNotFound,
	Response,
	DeleteResponse,
	ExistsResponse,
	Range,
	ContentResponse,
	SignedUrlOptions,
	SignedUrlResponse,
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

	public driver() {
		return this.apiClient;
	}

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

	public async delete(location: string): Promise<DeleteResponse> {
		const { data: raw, error } = await this.apiClient.remove([location]);
		if (error) {
			throw new UnknownException(error, error.name, location);
		}
		return { raw, wasDeleted: true };
	}

	public async copy(src: string, dest: string): Promise<Response> {
		const { data: raw, error } = await this.apiClient.copy(src, dest);
		if (error) {
			throw new UnknownException(error, error.name, src);
		}
		return { raw };
	}

	public async move(src: string, dest: string): Promise<Response> {
		const { data: raw, error } = await this.apiClient.move(src, dest);
		if (error) {
			throw new UnknownException(error, error.name, src);
		}
		return { raw };
	}

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

	public async getSignedUrl(location: string, options?: SignedUrlOptions | undefined): Promise<SignedUrlResponse> {
		const { data: raw, error } = await this.apiClient.createSignedUrl(location, options?.expiry || 900);
		if (error) {
			throw new UnknownException(error, error.name, location);
		}
		return {
			signedUrl: raw.signedUrl,
			raw,
		};
	}

	public getUrl(path: string): string {
		const { data } = this.apiClient.getPublicUrl(path);
		return data.publicUrl;
	}

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

	public async *flatList(prefix?: string | undefined): AsyncIterable<FileListResponse> {
		const limit = 1000;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data: items, error } = await this.apiClient.list(prefix, { limit, offset });
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
