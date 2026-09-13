import { Agent as HttpAgent, type AgentOptions as HttpAgentOptions } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { DEFAULT_CHUNK_SIZE } from '@directus/constants';
import type { TusDriver } from '@directus/storage';
import type { ChunkedUploadContext, ReadOptions } from '@directus/types';
import { normalizePath } from '@directus/utils';
import { StorageClient } from '@supabase/storage-js';
import * as tus from 'tus-js-client';
import type { RequestInit } from 'undici';
import { EnvHttpProxyAgent, fetch as undiciFetch } from 'undici';

/**
 * Two independent HTTP transports are in play here, so two independent proxy mechanisms are
 * needed - this is intentional, not something to unify:
 *
 *  - The Supabase SDK and our own `read()` calls go through undici's `fetch`, which
 *    `EnvHttpProxyAgent` (below) makes proxy-aware.
 *  - `writeChunk`'s TUS upload goes through tus-js-client's `NodeHttpStack`, which talks to
 *    node:http/node:https directly and knows nothing about undici or its dispatchers. That one is
 *    made proxy-aware further down, via a plain Node `Agent` configured with `proxyEnv`.
 *
 * Both read HTTP_PROXY/HTTPS_PROXY/NO_PROXY from the environment; they just do it through two
 * different APIs because the two transports don't share one.
 */

/**
 * Constructed once and reused for every `DriverSupabase` instance in this process: proxy config is
 * process-wide state (env vars), so there's nothing instance-specific to justify a new dispatcher
 * (and its own connection pool) per driver instance.
 */
const proxyDispatcher = new EnvHttpProxyAgent();

/**
 * Wraps undici's `fetch` with the shared dispatcher above. Used directly for our own `read()`
 * calls below; adapted for `StorageClient`'s `fetch` option further down.
 */
const proxyAwareFetch = (input: Parameters<typeof undiciFetch>[0], init?: Parameters<typeof undiciFetch>[1]) =>
	undiciFetch(input, { ...init, dispatcher: proxyDispatcher });

/**
 * `StorageClient` types its `fetch` option against the ambient global `fetch`. In this workspace
 * that resolves to `undici-types` (bundled with `@types/node`), a *different* version of undici's
 * own type declarations than the ones `proxyAwareFetch` above is built from (the standalone
 * `undici` package). The two are structurally close but not identical - confirmed via `tsc`, not
 * assumed - so this cast reflects a real, versioned type mismatch rather than laziness. It's
 * intentionally isolated to this one SDK boundary instead of spread across every call site.
 */
const proxyAwareFetchForSdk = proxyAwareFetch as unknown as typeof globalThis.fetch;

/**
 * `NodeHttpStack` (exported here as `DefaultHttpStack`) spreads its `requestOptions` straight into
 * node:http/node:https's own `request()`, which only understands a Node `Agent`, not an undici
 * `Dispatcher` - hence a second, separate proxy mechanism from `proxyDispatcher` above. `proxyEnv`
 * is Node's built-in agent option for HTTP_PROXY/HTTPS_PROXY/NO_PROXY support; `@types/node`
 * doesn't declare it in this workspace's pinned version, hence the local type extension.
 */
type AgentOptionsWithProxy = HttpAgentOptions & { proxyEnv?: NodeJS.ProcessEnv };

const tusAgentOptions: AgentOptionsWithProxy = { proxyEnv: process.env };
const tusHttpAgent = new HttpAgent(tusAgentOptions);
const tusHttpsAgent = new HttpsAgent(tusAgentOptions);

export type DriverSupabaseConfig = {
	bucket: string;
	serviceRole: string;
	projectId?: string;
	/** Allows a custom Supabase endpoint for self-hosting */
	endpoint?: string;
	root?: string;
	tus?: {
		chunkSize?: number;
	};
};

export class DriverSupabase implements TusDriver {
	private config: DriverSupabaseConfig & { root: string };
	private client: StorageClient;
	private bucket: ReturnType<StorageClient['from']>;
	private readonly tusHttpStack: InstanceType<typeof tus.DefaultHttpStack>;

	// TUS specific members
	private readonly preferredChunkSize: number;

	constructor(config: DriverSupabaseConfig) {
		this.config = {
			...config,
			root: normalizePath(config.root ?? '', { removeLeading: true }),
		};

		this.preferredChunkSize = this.config.tus?.chunkSize ?? DEFAULT_CHUNK_SIZE;

		this.client = this.getClient();
		this.bucket = this.getBucket();

		// The resumable endpoint is fixed per instance, so the matching agent (see the
		// AgentOptionsWithProxy comment above) is picked once here rather than per request.
		const protocol = this.endpoint.startsWith('http://') ? 'http:' : 'https:';
		this.tusHttpStack = new tus.DefaultHttpStack({ agent: protocol === 'http:' ? tusHttpAgent : tusHttpsAgent });
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

		return new StorageClient(
			this.endpoint,
			{
				apikey: this.config.serviceRole,
				Authorization: `Bearer ${this.config.serviceRole}`,
			},
			proxyAwareFetchForSdk,
		);
	}

	private getBucket() {
		if (!this.config.bucket) {
			throw new Error('`bucket` is required');
		}

		return this.client.from(this.config.bucket);
	}

	private fullPath(filepath: string) {
		const path = join(this.config.root, filepath);
		// Supabase expects an empty string for current directory
		if (path === '.') return '';
		return normalizePath(path);
	}

	private getAuthenticatedUrl(filepath: string) {
		return `${this.endpoint}/${join('object/authenticated', this.config.bucket, this.fullPath(filepath))}`;
	}

	private getResumableUrl() {
		return `${this.endpoint}/upload/resumable`;
	}

	async read(filepath: string, options?: ReadOptions): Promise<Readable> {
		const { range } = options || {};

		const requestInit: RequestInit = { method: 'GET' };

		requestInit.headers = {
			Authorization: `Bearer ${this.config.serviceRole}`,
		};

		if (range) {
			requestInit.headers['Range'] = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
		}

		const response = await proxyAwareFetch(this.getAuthenticatedUrl(filepath), requestInit);

		if (response.status >= 400 || !response.body) {
			// An unread body holds its connection open
			await response.body?.cancel();

			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return Readable.fromWeb(response.body);
	}

	private async find(filepath: string) {
		let rootPath = join(this.config.root, dirname(filepath));
		// Supabase expects an empty string for current directory
		if (rootPath === '.') rootPath = '';

		const rootFolder = normalizePath(rootPath);

		const { data, error } = await this.bucket.list(rootFolder, {
			search: basename(filepath),
			limit: 1,
		});

		if (error) throw error;

		return data[0];
	}

	async stat(filepath: string): Promise<{
		size: any;
		modified: Date;
	}> {
		const file = await this.find(filepath);

		if (!file) {
			throw new Error('File not found');
		}

		// metadata is null for folders
		return {
			size: file.metadata?.['contentLength'] ?? 0,
			modified: new Date(file.metadata?.['lastModified'] || 0),
		};
	}

	async exists(filepath: string): Promise<boolean> {
		return (await this.find(filepath)) !== undefined;
	}

	async move(src: string, dest: string): Promise<void> {
		await this.bucket.move(this.fullPath(src), this.fullPath(dest));
	}

	async copy(src: string, dest: string): Promise<void> {
		await this.bucket.copy(this.fullPath(src), this.fullPath(dest));
	}

	async write(filepath: string, content: Readable, type?: string): Promise<void> {
		const { error } = await this.bucket.upload(this.fullPath(filepath), content, {
			contentType: type ?? '',
			cacheControl: '3600',
			upsert: true,
			duplex: 'half',
		});

		if (error) {
			throw new Error(`Error uploading file "${filepath}"`, { cause: error });
		}
	}

	async delete(filepath: string): Promise<void> {
		await this.bucket.remove([this.fullPath(filepath)]);
	}

	list(prefix = ''): AsyncIterable<string> {
		const fullPrefix = this.fullPath(prefix);
		return this.listGenerator(fullPrefix);
	}

	async *listGenerator(prefix: string): AsyncIterable<string> {
		const limit = 1000;
		let offset = 0;
		let itemCount;

		/*
		 *	The Supabase API only returns the directories and files directly within the queried location
		 *	(called prefix in their API) matching the search query. Directories can be identified by the id being null.
		 *
		 *	Since it's unknown whether the last part of the prefix param is a directory, a file or part of a directory or file name,
		 *	the first query will be the largest common denominator (the parent directory part of the prefix)
		 *	and the results then filtered with the remaining part of the query.
		 *
		 *	This can lead to the following outcomes:
		 *	1. The full prefix is a file and is split up into parentdir/filename, the API is queried with
		 *	   { prefix: parentdir, search: filename } and returns one result { name: filename, id: "..." }.
		 *	   The filename is yielded in that case.
		 *	2. The full prefix is a directory and is split up into parentdir/dir, the API is queried with
		 *	   { prefix: parentdir, search: dir } and returns one result { name: dir, id: null } and importantly, not the
		 *	   contents of the directory. Then  the contents of the directory must be listed recursively by calling this
		 *	   function with the prefix and a trailing "/".
		 *	   2.1. The prefix ends with a "/", the API is queried with { prefix: prefix, search: "" }
		 *	        and returns all files and directories within the prefix, which are yielded and recursively listed.
		 *	3. Special case of 1. and 2.: The prefix is part of a filename/directory name and could result in more than one result
		 *	   that all match the search query. The API is queried with { prefix: parentdir, search: part of filename }
		 *	   and returns all files and directories in parentdir that match the search query. Filenames are yielded and
		 *	   directories are recursively listed.
		 */
		const isDirectory = prefix.endsWith('/');
		const prefixDirectory = isDirectory ? prefix : dirname(prefix);
		const search = isDirectory ? '' : (prefix.split('/').pop() ?? '');

		do {
			const { data, error } = await this.bucket.list(prefixDirectory, {
				limit,
				offset,
				search,
			});

			if (!data || error) {
				break;
			}

			itemCount = data.length;
			offset += itemCount;

			for (const item of data) {
				// Since the API only returns the filename, the file path is constructed by joining the prefix with the item name
				const filePath = normalizePath(join(prefixDirectory, item.name));

				if (item.id !== null) {
					// Remove the root from the path and yield the filename
					yield filePath.substring(this.config.root ? this.config.root.length + 1 : 0);
				} else {
					// This is a directory, recursively list it
					yield* this.listGenerator(`${filePath}/`);
				}
			}
		} while (itemCount === limit);
	}

	get tusExtensions(): string[] {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(_filepath: string, context: ChunkedUploadContext): Promise<ChunkedUploadContext> {
		return context;
	}

	async writeChunk(
		filepath: string,
		content: Readable,
		offset: number,
		context: ChunkedUploadContext,
	): Promise<number> {
		let bytesUploaded = offset || 0;

		const metadata = {
			bucketName: this.config.bucket,
			objectName: this.fullPath(filepath),
			contentType: context.metadata!['type'] ?? 'image/png',
			cacheControl: '3600',
		};

		await new Promise((resolve, reject) => {
			const upload = new tus.Upload(content, {
				endpoint: this.getResumableUrl(),
				httpStack: this.tusHttpStack,
				// @ts-expect-error
				fileReader: new FileReader(),
				headers: {
					Authorization: `Bearer ${this.config.serviceRole}`,
					'x-upsert': 'true',
				},
				metadata,
				chunkSize: this.preferredChunkSize,
				uploadSize: context.size,
				retryDelays: null,
				onError(error) {
					reject(error);
				},
				onChunkComplete: function (chunkSize) {
					bytesUploaded += chunkSize;

					resolve(null);
				},
				onSuccess() {
					resolve(null);
				},
				onUploadUrlAvailable() {
					if (!context.metadata!['upload-url']) {
						context.metadata!['upload-url'] = upload.url;
					}
				},
			});

			if (context.metadata!['upload-url']) {
				upload.resumeFromPreviousUpload({
					size: context.size!,
					creationTime: context.metadata!['creation_date'] as string,
					metadata,
					uploadUrl: context.metadata!['upload-url'],
				} as any);
			}

			upload.start();
		});

		return bytesUploaded;
	}

	async finishChunkedUpload(_filepath: string, _context: ChunkedUploadContext): Promise<void> {}

	async deleteChunkedUpload(filepath: string, _context: ChunkedUploadContext): Promise<void> {
		await this.delete(filepath);
	}
}

export default DriverSupabase;

/**
 * dirname implementation that always uses '/' to split and returns '' in case of no separator present.
 */
function dirname(path: string) {
	return path.split('/').slice(0, -1).join('/');
}

// @ts-expect-error
class StreamSource extends tus.StreamSource {
	_streamEnded = false;

	// @ts-expect-error
	override async slice(start: number, end: number) {
		if (this._streamEnded) return null;

		// Act like the stream ended after it's been called once
		this._streamEnded = true;

		// Shift the start and end offsets to always start at 0, since the read stream is only a stream of one chunk with
		// length of `chunkSize`
		return super.slice(0, end - start);
	}
}

class FileReader {
	async openFile(input: Readable, _: number): Promise<StreamSource> {
		// @ts-expect-error
		return new StreamSource(input);
	}
}
