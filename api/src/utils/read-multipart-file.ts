import { Readable } from 'node:stream';
import { ContentTooLargeError, InvalidPayloadError, UnsupportedMediaTypeError } from '@directus/errors';
import Busboy from 'busboy';
import type { Request } from 'express';

export interface UploadedFile {
	mimetype: string;
	stream: Readable;
}

export interface ReadMultipartFileOptions {
	maxFileSize?: number | undefined;
}

/**
 * Extract the first uploaded file from a `multipart/form-data` request as a stream plus its mimetype.
 */
export function readMultipartFile(req: Request, options: ReadMultipartFileOptions = {}): Promise<UploadedFile> {
	if (!req.is('multipart/form-data')) {
		return Promise.reject(
			new UnsupportedMediaTypeError({
				mediaType: req.headers['content-type'] ?? 'unknown',
				where: 'Content-Type header',
			}),
		);
	}

	return new Promise((resolve, reject) => {
		const headers = req.headers['content-type']
			? req.headers
			: { ...req.headers, 'content-type': 'application/octet-stream' };

		const limits = options.maxFileSize !== undefined ? { fileSize: options.maxFileSize } : {};

		const busboy = Busboy({ headers, limits });

		let fileFound = false;

		busboy.on('file', (_fieldname, fileStream, { mimeType }) => {
			fileFound = true;

			if (options.maxFileSize !== undefined) {
				fileStream.on('limit', () => fileStream.destroy(new ContentTooLargeError()));
			}

			resolve({ mimetype: mimeType, stream: fileStream });
		});

		busboy.on('error', (err: Error) => reject(err));

		busboy.on('close', () => {
			if (!fileFound) reject(new InvalidPayloadError({ reason: `No file was included in the request` }));
		});

		req.pipe(busboy);
	});
}
