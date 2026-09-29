import { InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import { parseJSON } from '@directus/utils';
import { readableStreamToString } from '@directus/utils/node';
import type { RequestHandler } from 'express';
import { load as loadYaml } from 'js-yaml';
import asyncHandler from '../utils/async-handler.js';
import { readMultipartFile } from '../utils/read-multipart-file.js';

export interface ReadFileUploadBodyOptions {
	maxFileSize?: number | undefined;
	allowYaml?: boolean | undefined;
}

/**
 * Populate `req.body` from an uploaded file so a handler can consume it uniformly.
 */
export default function readFileUploadBody(options: ReadFileUploadBodyOptions = {}): RequestHandler {
	const { maxFileSize, allowYaml = false } = options;

	return asyncHandler(async (req, _res, next) => {
		if (req.is('application/json')) {
			if (!req.body || Object.keys(req.body).length === 0) {
				throw new InvalidPayloadError({ reason: `No data was included in the body` });
			}

			return next();
		}

		const { mimetype, stream } = await readMultipartFile(req, { maxFileSize });

		const isJson = mimetype === 'application/json';

		if (!isJson && !allowYaml) {
			stream.destroy();
			throw new UnsupportedMediaTypeError({ mediaType: mimetype, where: 'file import' });
		}

		const raw = await readableStreamToString(stream);

		try {
			req.body = isJson ? parseJSON(raw) : loadYaml(raw);
		} catch {
			throw new InvalidPayloadError({ reason: `Uploaded file is not valid ${isJson ? 'JSON' : 'YAML'}` });
		}

		if (req.body === undefined || req.body === null) {
			throw new InvalidPayloadError({ reason: `No file was included in the request` });
		}

		return next();
	});
}
