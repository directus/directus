import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { StorageClient } from '@supabase/storage-js';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { Upload } from 'tus-js-client';
import type { RequestInit } from 'undici';
import { fetch } from 'undici';

export type DriverSupabaseConfig = {
	bucket: string;
	serviceRole: string;
	projectId?: string;
	// Allows a custom Supabase endpoint incase self-hosting
	endpoint?: string;
	root?: string;
	// NOTE: Still in Supabase beta
	resumableUpload?: boolean;
};

export class DriverSupabase implements Driver {
	private config: DriverSupabaseConfig;
	private client: StorageClient;
	private bucket: ReturnType<StorageClient['from']>;

	constructor(config: DriverSupabaseConfig) {
		this.config = config;
		this.client = this.getClient();
		this.bucket = this.getBucket();
	}

	private get endpoint() {
		return this.config.endpoint ?? `https://${this.config.projectId}.supabase.co/storage/v1`;
	}

	private getClient() {
		if (!this.config.projectId && !this.config.endpoint) {
			throw new Error('`project_id` or `endpoint` is required');
		}

		if (!this.config.serviceRole) {
			throw new Error('`service_role` is required');
		}

		return new StorageClient(this.endpoint, {
			apikey: this.config.serviceRole,
			Authorization: `Bearer ${this.config.serviceRole}`,
		});
	}

	private getBucket() {
		if (!this.config.bucket) {
			throw new Error('`bucket` is required');
		}

		return this.client.from(this.config.bucket);
	}

	private getFullPath(filepath: string) {
		return this.config.root ? normalizePath(join(this.config.root, filepath)) : filepath;
	}

	private getAuthenticatedUrl(filepath: string) {
		return `${this.endpoint}/${join('object/authenticated', this.config.bucket, this.getFullPath(filepath))}`;
	}

	async read(filepath: string, range?: Range) {
		const requestInit: RequestInit = { method: 'GET' };

		requestInit.headers = {
			Authorization: `Bearer ${this.config.serviceRole}`,
		};

		if (range) {
			requestInit.headers['Range'] = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
		}

		const response = await fetch(this.getAuthenticatedUrl(filepath), requestInit);

		if (response.status >= 400 || !response.body) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return Readable.fromWeb(response.body);
	}

	async head(filepath: string) {
		const response = await fetch(this.getAuthenticatedUrl(filepath), {
			method: 'HEAD',
			headers: {
				Authorization: `Bearer ${this.config.serviceRole}`,
			},
		});

		if (response.status >= 400) {
			throw new Error('File not found');
		}

		return response.headers;
	}

	async stat(filepath: string) {
		const headers = await this.head(filepath);

		return {
			size: parseInt(headers.get('content-length') || ''),
			modified: new Date(headers.get('last-modified') || ''),
		};
	}

	async exists(filepath: string) {
		try {
			await this.stat(filepath);
			return true;
		} catch {
			return false;
		}
	}

	// CHECK: Should src/dest use fullpath?
	async move(src: string, dest: string) {
		await this.bucket.move(src, dest);
	}

	// CHECK: Should src/dest use fullpath?
	async copy(src: string, dest: string) {
		await this.bucket.copy(src, dest);
	}

	async write(filepath: string, content: Readable, type?: string) {
		const fullPath = this.getFullPath(filepath);

		if (this.config.resumableUpload) {
			await this.resumableUpload(fullPath, content, type);
		} else {
			await this.bucket.upload(fullPath, content, {
				contentType: type ?? '',
				cacheControl: '3600',
				upsert: true,
				duplex: 'half',
			});
		}
	}

	// https://supabase.com/docs/guides/storage/uploads#resumable-upload
	async resumableUpload(filepath: string, content: Readable, type?: string) {
		const endpoint = normalizePath(join(this.endpoint, '/upload/resumable'));

		await new Promise<void>((resolve, reject) => {
			const upload = new Upload(content, {
				endpoint,
				retryDelays: [0, 3000, 5000, 10000, 20000],
				headers: {
					Authorization: `Bearer ${this.config.serviceRole}`,
					'x-upsert': 'true',
				},
				uploadLengthDeferred: true,
				uploadDataDuringCreation: true,
				metadata: {
					bucketName: this.config.bucket,
					objectName: filepath,
					contentType: type ?? '',
					cacheControl: '3600',
				},
				// NOTE: Supabase only supports 6MB chunks (for now), so it must be set to 6MB
				chunkSize: 6 * 1024 * 1024,
				onError(error) {
					reject(error);
				},
				onSuccess() {
					resolve();
				},
			});

			// Check if there are any previous uploads to continue.
			return upload.findPreviousUploads().then(function (previousUploads) {
				// Found previous uploads so we select the first one.
				if (previousUploads[0]) {
					upload.resumeFromPreviousUpload(previousUploads[0]);
				}

				upload.start();
			});
		});
	}

	async delete(filepath: string) {
		await this.bucket.remove([this.getFullPath(filepath)]);
	}

	async *list(prefix = '') {
		const limit = 1000;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data, error } = await this.bucket.list(this.config.root, { limit, offset, search: prefix });

			if (!data || error) {
				break;
			}

			itemCount = data.length;
			offset += itemCount;

			for (const item of data) {
				yield item.name;
			}
		} while (itemCount === limit);
	}
}

export default DriverSupabase;
