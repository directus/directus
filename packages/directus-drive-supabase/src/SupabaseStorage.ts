import {
	Storage,
	UnknownException,
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
import { Duplex } from 'node:stream';
import { ofetch, $Fetch } from 'ofetch';
import { joinURL } from 'ufo';

export interface SupabaseStorageConfig {
	endpoint: string;
	bucket: string;
	secret: string;
}

export class SupabaseStorage extends Storage {
	private bucket: string;
	private client: typeof ofetch;
	private endpoint: string;

	constructor({ endpoint, bucket, secret }: SupabaseStorageConfig) {
		super();

		this.endpoint = endpoint;
		this.bucket = bucket;
		this.client = ofetch.create({
			baseURL: endpoint,
			headers: {
				Authorization: `Bearer ${secret}`,
			},
		});
	}

	public driver(): $Fetch {
		return this.client;
	}

	public async put(
		path: string,
		content: string | Buffer | NodeJS.ReadableStream,
		contentType?: string | undefined
	): Promise<Response> {
		const raw = await this.client<{ Key: string }>(joinURL('object', this.bucket, path), {
			method: 'POST',
			headers: {
				'Content-Type': contentType,
			},
			body: content,
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, path);
		});
		return { raw };
	}

	public async delete(location: string): Promise<DeleteResponse> {
		const raw = await this.client<{ message: string }>(`object/${this.bucket}/${location}`, {
			method: 'DELETE',
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, location);
		});
		return { raw, wasDeleted: true };
	}

	public async copy(src: string, dest: string): Promise<Response> {
		const raw = await this.client<{ Key: string }>('object/copy', {
			method: 'POST',
			body: {
				bucketId: this.bucket,
				sourceKey: src,
				destinationKey: dest,
			},
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, src);
		});
		return { raw };
	}

	public async move(src: string, dest: string): Promise<Response> {
		const raw = await this.client<{ Key: string }>('object/move', {
			method: 'POST',
			body: {
				bucketId: this.bucket,
				sourceKey: src,
				destinationKey: dest,
			},
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, src);
		});
		return { raw };
	}

	public async getStat(path: string): Promise<StatResponse> {
		const raw = await this.client(`object/info/authenticated/${this.bucket}/${path}`).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, path);
		});
		return {
			size: raw.metadata.size,
			modified: new Date(raw.updated_at),
			raw,
		};
	}

	public async exists(location: string): Promise<ExistsResponse> {
		const { raw } = await this.getStat(location).catch((_error) => {
			return {
				exists: false,
				raw: null,
			};
		});

		return {
			exists: true,
			raw,
		};
	}

	public async getSignedUrl(location: string, options?: SignedUrlOptions | undefined): Promise<SignedUrlResponse> {
		const raw = await this.client(joinURL('object/sign', this.bucket, location), {
			method: 'POST',
			body: {
				expiresIn: options?.expiry,
			},
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, location);
		});
		return {
			signedUrl: raw.signedUrl,
			raw,
		};
	}

	public getUrl(path: string): string {
		return joinURL(this.endpoint, 'object/public', this.bucket, path);
	}

	public getStream(location: string, _range?: Range | undefined): NodeJS.ReadableStream {
		const promise = this.client(joinURL('object/authenticated', this.bucket, location), {
			responseType: 'blob',
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, location);
		});
		return Duplex.from(promise);
	}

	public async getBuffer(location: string): Promise<ContentResponse<Buffer>> {
		const raw = await this.client(joinURL('object/authenticated', this.bucket, location), {
			responseType: 'arrayBuffer',
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, location);
		});
		return {
			content: Buffer.from(raw),
			raw,
		};
	}

	public async *flatList(prefix?: string | undefined): AsyncIterable<FileListResponse> {
		const items = await this.client<{ name: string }[]>(joinURL('object/list', this.bucket), {
			method: 'POST',
			body: { prefix },
		}).catch((error) => {
			throw new UnknownException(error, error.data.statusCode, prefix ?? '');
		});

		for (const item of items) {
			yield {
				raw: item,
				path: item.name,
			};
		}
	}
}
