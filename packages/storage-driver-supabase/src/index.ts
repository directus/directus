import { StorageClient, } from '@supabase/storage-js';
import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { Upload } from 'tus-js-client'
import type { RequestInit } from 'undici';
import { fetch } from 'undici';
import { join } from 'node:path';
import { Readable } from 'node:stream';

export type DriverSupabaseConfig = {
	bucket: string;
	serviceRole: string;
	projectId?: string;
	// Allows a custom supabase endpoint to be set
	endpoint?: string;
	root?: string;
	simpleUpload?: boolean;
};

export class DriverSupabase implements Driver {
	private config: DriverSupabaseConfig;
	private client: StorageClient;
	private root: string;

	constructor(config: DriverSupabaseConfig) {
		this.config = config;
		this.client = this.getClient();
		this.root = this.config.root ? normalizePath(this.config.root, { removeLeading: true }) : '';

		if (this.config.simpleUpload === false) {
			console.warn('Chunked upload is still supabase beta');
		}
	}

	private getClient() {
		if (!this.config.projectId && !this.config.endpoint) {
			throw new Error('`project_id` or `endpoint` is required');
		}

		if (!this.config.serviceRole || !this.config.bucket) {
			throw new Error('`service_role` and `bucket` are required');
		}

		return new StorageClient(this.endpoint, {
			apikey: this.config.serviceRole,
			Authorization: `Bearer ${this.config.serviceRole}`,
		});	
	}

	private get endpoint() {
		return this.config.endpoint ?? `https://${this.config.projectId}.supabase.co/storage/v1`
	}

	private get bucket() {
		return this.client.from(this.config.bucket);
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	private getAuthenticatedUrl(filepath: string) {
		const fullPath = this.fullPath(filepath);
		return `${this.endpoint}/object/authenticated/${this.config.bucket}/${fullPath}`
	}

	async read(filepath: string, range?: Range) {
		const requestInit: RequestInit = { method: 'GET' };

		requestInit.headers = {
			Authorization: `Bearer ${this.config.serviceRole}` ,
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
				Authorization: `Bearer ${this.config.serviceRole}` ,
			}
		});

		if (response.status >= 400) {
			throw new Error('File not found')
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

	async move(src: string, dest: string) {
		await this.bucket.move(src, dest);
	}

	async copy(src: string, dest: string) {
		await this.bucket.copy(src, dest);
	}

	async write(filepath: string, content: Readable, type?: string) {
		if (this.config.simpleUpload !== false) {
			await this.bucket.upload(filepath, content, {
				contentType: type ?? '',
				cacheControl: '3600',
				upsert: true,
				duplex: 'half'
			});
		} else {
			await this.chunkUpload(filepath, content, type);
		}
	}

	// https://supabase.com/docs/guides/storage/uploads#resumable-upload
	async chunkUpload(filepath: string, content: Readable, type?: string) {
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
				chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
				onError(error) {
					reject(error)
				},
				onSuccess() {
					resolve()
				},
				// onProgress(bytesUploaded, bytesTotal) {
				// 	const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
				// 	console.log(bytesUploaded, bytesTotal, percentage + '%')
				// },
			})
	
			// Check if there are any previous uploads to continue.
			return upload.findPreviousUploads().then(function (previousUploads) {
				// Found previous uploads so we select the first one.
				if (previousUploads[0]) {
					upload.resumeFromPreviousUpload(previousUploads[0])
				}
	
				// Start the upload
				upload.start()
			})
		})
	}

	async delete(filepath: string) {
		await this.bucket.remove([filepath]);
	}

	async *list(prefix = '') {
		const limit = 1000;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data, error } = await this.bucket.list(this.root, { limit, offset, search: prefix }, {})

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
