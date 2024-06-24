/* eslint-disable no-console */
import { BaseHandler } from './base.js';
import { Upload, Uid, Metadata, EVENTS, ERRORS, DataStore, type CancellationContext } from '@tus/utils';
import { validateHeader } from '../validator.js';

import http from 'node:http';
import type {ServerOptions, WithRequired} from '../types.js'

export class PostHandler extends BaseHandler {
	// Overriding the `BaseHandler` type. We always set `namingFunction` in the constructor.
	declare options: WithRequired<ServerOptions, 'namingFunction'>;

	constructor(store: DataStore, options: ServerOptions) {
		if (options.namingFunction && typeof options.namingFunction !== 'function') {
			throw new Error("'namingFunction' must be a function");
		}

		if (!options.namingFunction) {
			options.namingFunction = Uid.rand;
		}

		super(store, options);
	}

	/**
	 * Create a file in the DataStore.
	 */
	async send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext) {
		if ('upload-concat' in req.headers && !this.store.hasExtension('concatentation')) {
			throw ERRORS.UNSUPPORTED_CONCATENATION_EXTENSION;
		}

		const upload_length = req.headers['upload-length'] as string | undefined;
		const upload_defer_length = req.headers['upload-defer-length'] as string | undefined;
		const upload_metadata = req.headers['upload-metadata'] as string | undefined;

		if (
			upload_defer_length !== undefined && // Throw error if extension is not supported
			!this.store.hasExtension('creation-defer-length')
		) {
			throw ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
		}

		if ((upload_length === undefined) === (upload_defer_length === undefined)) {
			throw ERRORS.INVALID_LENGTH;
		}

		let metadata: Record<string, string | null> = {};

		if ('upload-metadata' in req.headers) {
			try {
				metadata = Metadata.parse(upload_metadata);
			} catch {
				throw ERRORS.INVALID_METADATA;
			}
		}

		let id;

		try {
			id = await this.options.namingFunction(req, metadata);
		} catch (error) {
			console.log('create: check your `namingFunction`. Error', error);
			throw error;
		}

		const maxFileSize = await this.getConfiguredMaxSize(req, id);

		if (upload_length && maxFileSize > 0 && Number.parseInt(upload_length, 10) > maxFileSize) {
			throw ERRORS.ERR_MAX_SIZE_EXCEEDED;
		}

		if (this.options.onIncomingRequest) {
			await this.options.onIncomingRequest(req, res, id);
		}

		const upload = new Upload({
			id,
			offset: 0,
			metadata,
			...(upload_length ? { size: Number.parseInt(upload_length, 10) } : {})
		});

		if (this.options.onUploadCreate) {
			try {
				const resOrObject = await this.options.onUploadCreate(req, res, upload);

				// Backwards compatibility, remove in next major
				// Ugly check because we can't use `instanceof` because we mock the instance in tests
				if (
					typeof (resOrObject as http.ServerResponse).write === 'function' &&
					typeof (resOrObject as http.ServerResponse).writeHead === 'function'
				) {
					res = resOrObject as http.ServerResponse;
				} else {
					// Ugly types because TS only understands instanceof
					type ExcludeServerResponse<T> = T extends http.ServerResponse ? never : T;
					const obj = resOrObject as ExcludeServerResponse<typeof resOrObject>;
					res = obj.res;

					if (obj.metadata) {
						upload.metadata = obj.metadata;
					}
				}
			} catch (error) {
				if (error && typeof error === "object" && 'body' in error) {
					console.log(`onUploadCreate error: ${error.body}`);
				}

				throw error;
			}
		}

		const lock = await this.acquireLock(req, id, context);

		let isFinal: boolean;
		let url: string;

		//Recommended response defaults
		const responseData = {
			status: 201,
			headers: {} as Record<string, string | number>,
			body: '',
		};

		try {
			await this.store.create(upload);
			url = this.generateUrl(req, upload.id);

			this.emit(EVENTS.POST_CREATE, req, res, upload, url);

			isFinal = upload.size === 0 && !upload.sizeIsDeferred;

			// The request MIGHT include a Content-Type header when using creation-with-upload extension
			if (validateHeader('content-type', req.headers['content-type'])) {
				const bodyMaxSize = await this.calculateMaxBodySize(req, upload, maxFileSize);
				const newOffset = await this.writeToStore(req, upload, bodyMaxSize, context);

				responseData.headers['Upload-Offset'] = newOffset.toString();
				isFinal = newOffset === Number.parseInt(upload_length as string, 10);
				upload.offset = newOffset;
			}
		} catch (e) {
			context.abort();
			throw e;
		} finally {
			await lock.unlock();
		}

		if (isFinal && this.options.onUploadFinish) {
			try {
				const resOrObject = await this.options.onUploadFinish(req, res, upload);

				// Backwards compatibility, remove in next major
				// Ugly check because we can't use `instanceof` because we mock the instance in tests
				if (
					typeof (resOrObject as http.ServerResponse).write === 'function' &&
					typeof (resOrObject as http.ServerResponse).writeHead === 'function'
				) {
					res = resOrObject as http.ServerResponse;
				} else {
					// Ugly types because TS only understands instanceof
					type ExcludeServerResponse<T> = T extends http.ServerResponse ? never : T;
					const obj = resOrObject as ExcludeServerResponse<typeof resOrObject>;
					res = obj.res;
					if (obj.status_code) responseData.status = obj.status_code;
					if (obj.body) responseData.body = obj.body;
					if (obj.headers) responseData.headers = Object.assign(obj.headers, responseData.headers);
				}
			} catch (error) {
				if (error && typeof error === "object" && 'body' in error) {
					console.log(`onUploadFinish: ${error.body}`);
				}

				throw error;
			}
		}

		// The Upload-Expires response header indicates the time after which the unfinished upload expires.
		// If expiration is known at creation time, Upload-Expires header MUST be included in the response
		if (this.store.hasExtension('expiration') && this.store.getExpiration() > 0 && upload.creation_date) {
			const created = await this.store.getUpload(upload.id);

			if (created.offset !== Number.parseInt(upload_length as string, 10)) {
				const creation = new Date(upload.creation_date);

				// Value MUST be in RFC 7231 datetime format
				responseData.headers['Upload-Expires'] = new Date(
					creation.getTime() + this.store.getExpiration(),
				).toUTCString();
			}
		}

		//Only append Location header if its valid for the final http status (201 or 3xx)
		if (responseData.status === 201 || (responseData.status >= 300 && responseData.status < 400)) {
			responseData.headers['Location'] = url;
		}

		const writtenRes = this.write(res, responseData.status, responseData.headers, responseData.body);

		if (isFinal) {
			this.emit(EVENTS.POST_FINISH, req, writtenRes, upload);
		}

		return writtenRes;
	}
}
