/* eslint-disable no-console */
import http from 'node:http';
import { EventEmitter } from 'node:events';

import { GetHandler } from './handlers/get.js';
import { HeadHandler } from './handlers/head.js';
import { OptionsHandler } from './handlers/options.js';
import { PatchHandler } from './handlers/patch.js';
import { PostHandler } from './handlers/post.js';
import { DeleteHandler } from './handlers/delete.js';
import { validateHeader } from './validator.js';

import { EVENTS, ERRORS, EXPOSED_HEADERS, REQUEST_METHODS, TUS_RESUMABLE } from '@tus/utils';

import type stream from 'node:stream';
import type { ServerOptions, RouteHandler, WithOptional } from './types.js'
import type { DataStore, Upload, CancellationContext } from '@tus/utils';
import { MemoryLocker } from './lockers.js';

type Handlers = {
	GET: InstanceType<typeof GetHandler>;
	HEAD: InstanceType<typeof HeadHandler>;
	OPTIONS: InstanceType<typeof OptionsHandler>;
	PATCH: InstanceType<typeof PatchHandler>;
	POST: InstanceType<typeof PostHandler>;
	DELETE: InstanceType<typeof DeleteHandler>;
};

// interface TusEvents {
// 	[EVENTS.POST_CREATE]: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload, url: string) => void;
// 	[EVENTS.POST_RECEIVE_V2]: (req: http.IncomingMessage, upload: Upload) => void;
// 	[EVENTS.POST_FINISH]: (req: http.IncomingMessage, res: http.ServerResponse, upload: Upload) => void;
// 	[EVENTS.POST_TERMINATE]: (req: http.IncomingMessage, res: http.ServerResponse, id: string) => void;
// }

// type on = EventEmitter['on'];
// type emit = EventEmitter['emit'];

// export declare interface Server {
// 	on<Event extends keyof TusEvents>(event: Event, listener: TusEvents[Event]): this;
// 	on(eventName: Parameters<on>[0], listener: Parameters<on>[1]): this;

// 	emit<Event extends keyof TusEvents>(event: Event, listener: TusEvents[Event]): ReturnType<emit>;
// 	emit(eventName: Parameters<emit>[0], listener: Parameters<emit>[1]): ReturnType<emit>;
// }

// eslint-disable-next-line no-redeclare
export class TusServer extends EventEmitter {
	datastore: DataStore;
	handlers: Handlers;
	options: ServerOptions;

	constructor(options: WithOptional<ServerOptions, 'locker'> & { datastore: DataStore }) {
		super();

		if (!options) {
			throw new Error("'options' must be defined");
		}

		if (!options.path) {
			throw new Error("'path' is not defined; must have a path");
		}

		if (!options.datastore) {
			throw new Error("'datastore' is not defined; must have a datastore");
		}

		if (!options.locker) {
			options.locker = new MemoryLocker();
		}

		if (!options.lockDrainTimeout) {
			options.lockDrainTimeout = 3000;
		}

		if (!options.postReceiveInterval) {
			options.postReceiveInterval = 1000;
		}

		const { datastore, ...rest } = options;
		this.options = rest as ServerOptions;
		this.datastore = datastore;

		this.handlers = {
			// GET handlers should be written in the implementations
			GET: new GetHandler(this.datastore, this.options),
			// These methods are handled under the tus protocol
			HEAD: new HeadHandler(this.datastore, this.options),
			OPTIONS: new OptionsHandler(this.datastore, this.options),
			PATCH: new PatchHandler(this.datastore, this.options),
			POST: new PostHandler(this.datastore, this.options),
			DELETE: new DeleteHandler(this.datastore, this.options),
		};

		// Any handlers assigned to this object with the method as the key
		// will be used to respond to those requests. They get set/re-set
		// when a datastore is assigned to the server.
		// Remove any event listeners from each handler as they are removed
		// from the server. This must come before adding a 'newListener' listener,
		// to not add a 'removeListener' event listener to all request handlers.
		this.on('removeListener', (event: string, listener) => {
			this.datastore.removeListener(event, listener);

			for (const method of REQUEST_METHODS) {
				this.handlers[method].removeListener(event, listener);
			}
		});

		// As event listeners are added to the server, make sure they are
		// bubbled up from request handlers to fire on the server level.
		this.on('newListener', (event: string, listener) => {
			this.datastore.on(event, listener);

			for (const method of REQUEST_METHODS) {
				this.handlers[method].on(event, listener);
			}
		});
	}

	get(path: string, handler: RouteHandler) {
		this.handlers.GET.registerPath(path, handler);
	}

	/**
	 * Main server requestListener, invoked on every 'request' event.
	 */
	async handle(
		req: http.IncomingMessage,
		res: http.ServerResponse,
		// TODO: this return type does not make sense
	): Promise<http.ServerResponse | stream.Writable | void> {
		const context = this.createContext(req);

		console.log(`[TusServer] handle: ${req.method} ${req.url}`);

		// Allow overriding the HTTP method. The reason for this is
		// that some libraries/environments to not support PATCH and
		// DELETE requests, e.g. Flash in a browser and parts of Java
		if (req.headers['x-http-method-override']) {
			req.method = (req.headers['x-http-method-override'] as string).toUpperCase();
		}

		const onError = async (error: { status_code?: number; body?: string; message: string }) => {
			let status_code = error.status_code || ERRORS.UNKNOWN_ERROR.status_code;
			let body = error.body || `${ERRORS.UNKNOWN_ERROR.body}${error.message || ''}\n`;

			if (this.options.onResponseError) {
				const errorMapping = await this.options.onResponseError(req, res, error as Error);

				if (errorMapping) {
					status_code = errorMapping.status_code;
					body = errorMapping.body;
				}
			}

			return this.write(context, req, res, status_code, body);
		};

		if (req.method === 'GET') {
			const handler = this.handlers.GET;
			return handler.send(req, res).catch(onError);
		}

		// The Tus-Resumable header MUST be included in every request and
		// response except for OPTIONS requests. The value MUST be the version
		// of the protocol used by the Client or the Server.
		res.setHeader('Tus-Resumable', TUS_RESUMABLE);

		if (req.method !== 'OPTIONS' && req.headers['tus-resumable'] === undefined) {
			return this.write(context, req, res, 412, 'Tus-Resumable Required\n');
		}

		// Validate all required headers to adhere to the tus protocol
		const invalid_headers = [];

		for (const header_name in req.headers) {
			if (req.method === 'OPTIONS') {
				continue;
			}

			// Content type is only checked for PATCH requests. For all other
			// request methods it will be ignored and treated as no content type
			// was set because some HTTP clients may enforce a default value for
			// this header.
			// See https://github.com/tus/tus-node-server/pull/116
			if (header_name.toLowerCase() === 'content-type' && req.method !== 'PATCH') {
				continue;
			}

			if (!validateHeader(header_name, req.headers[header_name] as string | undefined)) {
				console.log(`Invalid ${header_name} header: ${req.headers[header_name]}`);
				invalid_headers.push(header_name);
			}
		}

		if (invalid_headers.length > 0) {
			return this.write(context, req, res, 400, `Invalid ${invalid_headers.join(' ')}\n`);
		}

		// Enable CORS
		res.setHeader('Access-Control-Expose-Headers', EXPOSED_HEADERS);

		if (req.headers.origin) {
			res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
		}

		// Invoke the handler for the method requested
		const handler = this.handlers[req.method as keyof Handlers];

		if (handler) {
			return handler.send(req, res, context).catch(onError);
		}

		return this.write(context, req, res, 404, 'Not found\n');
	}

	write(
		context: CancellationContext,
		req: http.IncomingMessage,
		res: http.ServerResponse,
		status: number,
		body = '',
		headers = {},
	) {
		const isAborted = context.signal.aborted;

		if (status !== 204) {
			// @ts-expect-error not explicitly typed but possible
			headers['Content-Length'] = Buffer.byteLength(body, 'utf8');
		}

		if (isAborted) {
			// This condition handles situations where the request has been flagged as aborted.
			// In such cases, the server informs the client that the connection will be closed.
			// This is communicated by setting the 'Connection' header to 'close' in the response.
			// This step is essential to prevent the server from continuing to process a request
			// that is no longer needed, thereby saving resources.

			// @ts-expect-error not explicitly typed but possible
			headers['Connection'] = 'close';

			// An event listener is added to the response ('res') for the 'finish' event.
			// The 'finish' event is triggered when the response has been sent to the client.
			// Once the response is complete, the request ('req') object is destroyed.
			// Destroying the request object is a crucial step to release any resources
			// tied to this request, as it has already been aborted.
			res.on('finish', () => {
				req.destroy();
			});
		}

		res.writeHead(status, headers);
		res.write(body);
		return res.end();
	}

	cleanUpExpiredUploads(): Promise<number> {
		if (!this.datastore.hasExtension('expiration')) {
			throw ERRORS.UNSUPPORTED_EXPIRATION_EXTENSION;
		}

		return this.datastore.deleteExpired();
	}

	protected createContext(req: http.IncomingMessage) {
		// Initialize two AbortControllers:
		// 1. `requestAbortController` for instant request termination, particularly useful for stopping clients to upload when errors occur.
		// 2. `abortWithDelayController` to introduce a delay before aborting, allowing the server time to complete ongoing operations.
		// This is particularly useful when a future request may need to acquire a lock currently held by this request.
		const requestAbortController = new AbortController();
		const abortWithDelayController = new AbortController();

		const onDelayedAbort = (err: unknown) => {
			abortWithDelayController.signal.removeEventListener('abort', onDelayedAbort);

			setTimeout(() => {
				requestAbortController.abort(err);
			}, this.options.lockDrainTimeout);
		};

		abortWithDelayController.signal.addEventListener('abort', onDelayedAbort);

		req.on('close', () => {
			abortWithDelayController.signal.removeEventListener('abort', onDelayedAbort);
		});

		return {
			signal: requestAbortController.signal,
			abort: () => {
				// abort the request immediately
				if (!requestAbortController.signal.aborted) {
					requestAbortController.abort(ERRORS.ABORTED);
				}
			},
			cancel: () => {
				// Initiates the delayed abort sequence unless it's already in progress.
				if (!abortWithDelayController.signal.aborted) {
					abortWithDelayController.abort(ERRORS.ABORTED);
				}
			},
		};
	}
}
