import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { StorageClient } from '@supabase/storage-js';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import type { RequestInit } from 'undici';
import { fetch } from 'undici';

export type DriverSupabaseConfig = {
	bucket: string;
	serviceRole: string;
	projectId?: string;
	// Allows a custom Supabase endpoint incase self-hosting
	endpoint?: string;
	root?: string;
};

export class DriverSupabase implements Driver {
	private config: DriverSupabaseConfig & { root: string };
	private client: StorageClient;
	private bucket: ReturnType<StorageClient['from']>;

	constructor(config: DriverSupabaseConfig) {
		this.config = {
			...config,
			root: normalizePath(config.root ?? '', { removeLeading: true }),
		};

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

	private fullPath(filepath: string) {
		return normalizePath(join(this.config.root, filepath));
	}

	private getAuthenticatedUrl(filepath: string) {
		return `${this.endpoint}/${join('object/authenticated', this.config.bucket, this.fullPath(filepath))}`;
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

	async move(src: string, dest: string) {
		await this.bucket.move(this.fullPath(src), this.fullPath(dest));
	}

	async copy(src: string, dest: string) {
		await this.bucket.copy(this.fullPath(src), this.fullPath(dest));
	}

	async write(filepath: string, content: Readable, type?: string) {
		await this.bucket.upload(this.fullPath(filepath), content, {
			contentType: type ?? '',
			cacheControl: '3600',
			upsert: true,
			duplex: 'half',
		});
	}

	async delete(filepath: string) {
		await this.bucket.remove([this.fullPath(filepath)]);
	}

	async *list(prefix = ''): AsyncIterable<string> {
		const limit = 1000;
		let offset = 0;
		let itemCount = 0;

		do {
			const { data, error } = await this.bucket.list(this.fullPath(prefix), { limit, offset });

			if (!data || error) {
				break;
			}

			itemCount = data.length;
			offset += itemCount;

			for (const item of data) {
				if (item.id !== null) {
					// the API only return the pure filename, join it with the prefix for a relative path without root
					yield normalizePath(join(prefix, item.name), { removeLeading: true });
				} else {
					// this is a directory, recursively list it
					yield* this.list(normalizePath(join(prefix, item.name)));
				}
			}
		} while (itemCount === limit);
	}
}

export default DriverSupabase;
