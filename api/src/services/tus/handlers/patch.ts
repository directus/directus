/* eslint-disable no-console */
import { BaseHandler } from './base.js';

import type http from 'node:http';
import { ERRORS, EVENTS, type CancellationContext, Upload } from '@tus/utils';

export class PatchHandler extends BaseHandler {
	/**
	 * Write data to the DataStore and return the new offset.
	 */
	async send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext) {
		try {
			const id = this.getFileIdFromRequest(req);

			if (!id) {
				throw ERRORS.FILE_NOT_FOUND;
			}

			// The request MUST include a Upload-Offset header
			if (req.headers['upload-offset'] === undefined) {
				throw ERRORS.MISSING_OFFSET;
			}

			const offset = Number.parseInt(req.headers['upload-offset'] as string, 10);

			// The request MUST include a Content-Type header
			const content_type = req.headers['content-type'];

			if (content_type === undefined) {
				throw ERRORS.INVALID_CONTENT_TYPE;
			}

			if (this.options.onIncomingRequest) {
				await this.options.onIncomingRequest(req, res, id);
			}

			const maxFileSize = await this.getConfiguredMaxSize(req, id);

			const lock = await this.acquireLock(req, id, context);

			let upload: Upload;
			let newOffset: number;

			try {
				upload = await this.store.getUpload(id);

				// If a Client does attempt to resume an upload which has since
				// been removed by the Server, the Server SHOULD respond with the
				// with the 404 Not Found or 410 Gone status. The latter one SHOULD
				// be used if the Server is keeping track of expired uploads.
				const now = Date.now();
				const creation = upload.creation_date ? new Date(upload.creation_date).getTime() : now;
				const expiration = creation + this.store.getExpiration();

				if (this.store.hasExtension('expiration') && this.store.getExpiration() > 0 && now > expiration) {
					throw ERRORS.FILE_NO_LONGER_EXISTS;
				}

				if (upload.offset !== offset) {
					// If the offsets do not match, the Server MUST respond with the 409 Conflict status without modifying the upload resource.
					console.log(`[PatchHandler] send: Incorrect offset - ${offset} sent but file is ${upload.offset}`);
					throw ERRORS.INVALID_OFFSET;
				}

				// The request MUST validate upload-length related headers
				const upload_length = req.headers['upload-length'] as string | undefined;

				if (upload_length !== undefined) {
					const size = Number.parseInt(upload_length, 10);

					// Throw error if extension is not supported
					if (!this.store.hasExtension('creation-defer-length')) {
						throw ERRORS.UNSUPPORTED_CREATION_DEFER_LENGTH_EXTENSION;
					}

					// Throw error if upload-length is already set.
					if (upload.size !== undefined) {
						throw ERRORS.INVALID_LENGTH;
					}

					if (size < upload.offset) {
						throw ERRORS.INVALID_LENGTH;
					}

					if (maxFileSize > 0 && size > maxFileSize) {
						throw ERRORS.ERR_MAX_SIZE_EXCEEDED;
					}

					await this.store.declareUploadLength(id, size);
					upload.size = size;
				}

				const maxBodySize = await this.calculateMaxBodySize(req, upload, maxFileSize);
				newOffset = await this.writeToStore(req, upload, maxBodySize, context);
			} finally {
				await lock.unlock();
			}

			upload.offset = newOffset;
			this.emit(EVENTS.POST_RECEIVE, req, res, upload);

			//Recommended response defaults
			const responseData = {
				status: 204,
				headers: {
					'Upload-Offset': newOffset,
				} as Record<string, string | number>,
				body: '',
			};

			if (newOffset === upload.size && this.options.onUploadFinish) {
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

			if (
				this.store.hasExtension('expiration') &&
				this.store.getExpiration() > 0 &&
				upload.creation_date &&
				(upload.size === undefined || newOffset < upload.size)
			) {
				const creation = new Date(upload.creation_date);
				// Value MUST be in RFC 7231 datetime format
				const dateString = new Date(creation.getTime() + this.store.getExpiration()).toUTCString();
				responseData.headers['Upload-Expires'] = dateString;
			}

			// The Server MUST acknowledge successful PATCH requests with the 204
			const writtenRes = this.write(res, responseData.status, responseData.headers, responseData.body);

			if (newOffset === upload.size) {
				this.emit(EVENTS.POST_FINISH, req, writtenRes, upload);
			}

			return writtenRes;
		} catch (e) {
			context.abort();
			throw e;
		}
	}
}
