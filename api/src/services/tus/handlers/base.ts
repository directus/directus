import EventEmitter from 'node:events';
import stream from 'node:stream/promises';
import { addAbortSignal, PassThrough } from 'node:stream';
import type http from 'node:http';

import type {ServerOptions} from '../types.js'
import type { DataStore, CancellationContext } from '@tus/utils';
import { ERRORS, Upload, StreamLimiter, EVENTS } from '@tus/utils';
// import { throttle } from 'lodash';

const reExtractFileID = /([^/]+)\/?$/;
const reForwardedHost = /host="?([^";]+)/;
const reForwardedProto = /proto=(https?)/;

export class BaseHandler extends EventEmitter {
	options: ServerOptions;
	store: DataStore;

	constructor(store: DataStore, options: ServerOptions) {
		super();

		if (!store) {
			throw new Error('Store must be defined');
		}

		this.store = store;
		this.options = options;
	}

	write(res: http.ServerResponse, status: number, headers = {}, body = '') {
		if (status !== 204) {
			// @ts-expect-error not explicitly typed but possible
			headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
		}

		res.writeHead(status, headers);
		res.write(body);
		return res.end();
	}

	generateUrl(req: http.IncomingMessage, id: string) {
		const path = this.options.path === '/' ? '' : this.options.path;

		if (this.options.generateUrl) {
			// user-defined generateUrl function
			const { proto, host } = this.extractHostAndProto(req);

			return this.options.generateUrl(req, {
				proto,
				host,
				path: path,
				id,
			});
		}

		// Default implementation
		if (this.options.relativeLocation) {
			return `${path}/${id}`;
		}

		const { proto, host } = this.extractHostAndProto(req);

		return `${proto}://${host}${path}/${id}`;
	}

	getFileIdFromRequest(req: http.IncomingMessage) {
		const match = reExtractFileID.exec(req.url as string);

		if (!match || !match[1]) return;

		if (this.options.getFileIdFromRequest) {
			const lastPath = match ? decodeURIComponent(match[1]) : undefined;
			return this.options.getFileIdFromRequest(req, lastPath);
		}

		if (!match || this.options.path.includes(match[1])) return;

		return decodeURIComponent(match[1]);
	}

	protected extractHostAndProto(req: http.IncomingMessage) {
		let proto;
		let host;

		if (this.options.respectForwardedHeaders) {
			const forwarded = req.headers.forwarded as string | undefined;

			if (forwarded) {
				host ??= reForwardedHost.exec(forwarded)?.[1];
				proto ??= reForwardedProto.exec(forwarded)?.[1];
			}

			const forwardHost = req.headers['x-forwarded-host'];
			const forwardProto = req.headers['x-forwarded-proto'];

			// @ts-expect-error we can pass undefined
			if (['http', 'https'].includes(forwardProto)) {
				proto ??= forwardProto as string;
			}

			host ??= forwardHost;
		}

		host ??= req.headers.host;
		proto ??= 'http';

		return { host: host as string, proto };
	}

	protected async getLocker(req: http.IncomingMessage) {
		if (typeof this.options.locker === 'function') {
			return this.options.locker(req);
		}

		return this.options.locker;
	}

	protected async acquireLock(req: http.IncomingMessage, id: string, context: CancellationContext) {
		const locker = await this.getLocker(req);

		const lock = locker.newLock(id);

		await lock.lock(() => {
			context.cancel();
		});

		return lock;
	}

	protected writeToStore(req: http.IncomingMessage, upload: Upload, maxFileSize: number, context: CancellationContext) {
		return new Promise<number>((resolve, reject) => {
			// Abort early if the operation has been cancelled.
			if (context.signal.aborted) {
				reject(ERRORS.ABORTED);
				return;
			}

			// Create a PassThrough stream as a proxy to manage the request stream.
			// This allows for aborting the write process without affecting the incoming request stream.
			const proxy = new PassThrough();
			addAbortSignal(context.signal, proxy);

			proxy.on('error', (err) => {
				req.unpipe(proxy);
				reject(err.name === 'AbortError' ? ERRORS.ABORTED : err);
			});

			// const postReceive = throttle(
			// 	(offset: number) => {

			// 	},
			// 	this.options.postReceiveInterval,
			// 	{ leading: false },
			// );

			let tempOffset = upload.offset;

			proxy.on('data', (chunk: Buffer) => {
				tempOffset += chunk.byteLength;
				this.emit(EVENTS.POST_RECEIVE_V2, req, { ...upload, offset: tempOffset });
				// postReceive(tempOffset);
			});

			req.on('error', () => {
				if (!proxy.closed) {
					// we end the stream gracefully here so that we can upload the remaining bytes to the store
					// as an incompletePart
					proxy.end();
				}
			});

			// Pipe the request stream through the proxy. We use the proxy instead of the request stream directly
			// to ensure that errors in the pipeline do not cause the request stream to be destroyed,
			// which would result in a socket hangup error for the client.
			stream
				.pipeline(req.pipe(proxy), new StreamLimiter(maxFileSize), async (stream) => {
					return this.store.write(stream as StreamLimiter, upload.id, upload.offset);
				})
				.then(resolve)
				.catch(reject);
		});
	}

	getConfiguredMaxSize(req: http.IncomingMessage, id: string | null) {
		if (typeof this.options.maxSize === 'function') {
			return this.options.maxSize(req, id);
		}

		return this.options.maxSize ?? 0;
	}

	/**
	 * Calculates the maximum allowed size for the body of an upload request.
	 * This function considers both the server's configured maximum size and
	 * the specifics of the upload, such as whether the size is deferred or fixed.
	 */
	async calculateMaxBodySize(req: http.IncomingMessage, file: Upload, configuredMaxSize?: number) {
		// Use the server-configured maximum size if it's not explicitly provided.
		configuredMaxSize ??= await this.getConfiguredMaxSize(req, file.id);

		// Parse the Content-Length header from the request (default to 0 if not set).
		const length = parseInt(req.headers['content-length'] || '0', 10);
		const offset = file.offset;

		const hasContentLengthSet = req.headers['content-length'] !== undefined;
		const hasConfiguredMaxSizeSet = configuredMaxSize > 0;

		if (file.sizeIsDeferred) {
			// For deferred size uploads, if it's not a chunked transfer, check against the configured maximum size.
			if (hasContentLengthSet && hasConfiguredMaxSizeSet && offset + length > configuredMaxSize) {
				throw ERRORS.ERR_SIZE_EXCEEDED;
			}

			if (hasConfiguredMaxSizeSet) {
				return configuredMaxSize - offset;
			} else {
				return Number.MAX_SAFE_INTEGER;
			}
		}

		// Check if the upload fits into the file's size when the size is not deferred.
		if (offset + length > (file.size || 0)) {
			throw ERRORS.ERR_SIZE_EXCEEDED;
		}

		if (hasContentLengthSet) {
			return length;
		}

		return (file.size || 0) - offset;
	}
}
