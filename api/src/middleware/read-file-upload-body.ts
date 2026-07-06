/**
 * Read an uploaded JSON file into `req.body` so a handler can consume it like a regular JSON body.
 */

import { text } from 'node:stream/consumers';
import { InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import type { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler.js';
import { readMultipartFile } from '../utils/read-multipart-file.js';

export interface ReadFileUploadBodyOptions {
	maxFileSize?: number | undefined;
}

export default function readFileUploadBody(options: ReadFileUploadBodyOptions = {}): RequestHandler {
	return asyncHandler(async (req, _res, next) => {
		const { mimetype, stream } = await readMultipartFile(req, { maxFileSize: options.maxFileSize });

		if (mimetype !== 'application/json') {
			stream.destroy();
			throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}

		// Rejects with ContentTooLargeError if the upload exceeds maxFileSize
		const raw = await text(stream);

		try {
			req.body = JSON.parse(raw);
		} catch {
			throw new InvalidPayloadError({ reason: `Uploaded file is not valid JSON` });
		}

		return next();
	});
}
