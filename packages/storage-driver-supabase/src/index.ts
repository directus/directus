import { StorageClient, } from '@supabase/storage-js';
import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { Upload } from 'tus-js-client'
import { fetch } from 'undici';
import { join } from 'node:path';
import { Readable } from 'node:stream';

export type DriverSupabaseConfig = {
	bucket: string;
	secret: string;
	projectId?: string;
	// Allows a custom supabase endpoint to be set
	endpoint?: string;
	root?: string;
};

export class DriverSupabase implements Driver {
	private config: DriverSupabaseConfig;
	private client: StorageClient;
	private root: string;

	constructor(config: DriverSupabaseConfig) {
		this.config = config;
		this.client = this.getClient();
		this.root = this.config.root ? normalizePath(this.config.root, { removeLeading: true }) : '';
	}


	private getClient() {
		if (!this.config.projectId && !this.config.endpoint) {
			throw new Error('`projectId` or `endpoint` is required');
		}

		if (!this.config.secret || !this.config.bucket) {
			throw new Error('`secret` and `bucket` are required');
		}

		return new StorageClient(this.endpoint, {
			apikey: this.config.secret,
			Authorization: `Bearer ${this.config.secret}`,
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
		const response = await fetch(this.getAuthenticatedUrl(filepath), {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.config.secret}` ,
				Range: range ? `bytes=${range.start ?? ''}-${range.end ?? ''}` : undefined,
			}
		});

		if (response.status >= 400 || !response.body) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return Readable.fromWeb(response.body);
	}

	async head(filepath: string) {
		const response = await fetch(this.getAuthenticatedUrl(filepath), {
			method: 'HEAD',
			headers: {
				Authorization: `Bearer ${this.config.secret}` ,
			}
		});

		return response.headers;
	}

	async stat(filepath: string) {
		const headers = await this.head(filepath);

		return {
			size: parseInt(headers['content-length'] || ''),
			modified: new Date(headers['last-modified'] || ''),
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

	// Chunked upload
	// https://supabase.com/docs/guides/storage/uploads#resumable-upload
	async write(filepath: string, content: Readable, type?: string) {
		const endpoint = normalizePath(join(this.endpoint, '/upload/resumable'));

		await new Promise<void>((resolve, reject) => {
			const upload = new Upload(content, {
				endpoint,
				retryDelays: [0, 3000, 5000, 10000, 20000],
				headers: {
					authorization: `Bearer ${this.config.secret}`,
					'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
				},
				uploadDataDuringCreation: true,
				metadata: {
					bucketName: this.config.bucket,
					objectName: filepath,
					contentType: type,
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
				if (previousUploads.length) {
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
			const { data } = await this.bucket.list(this.fullPath(prefix), { limit, offset }, {})

			itemCount = data.length;
			offset += itemCount;

			for (const item of data) {
				// TODO: Check if should be id or name
				yield item.id;
			}
		} while (itemCount === limit);
	}
}

export default DriverSupabase;
