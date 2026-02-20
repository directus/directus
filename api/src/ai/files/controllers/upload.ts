import type { IncomingHttpHeaders } from 'node:http';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import { uploadToProvider } from '../lib/upload-to-provider.js';
import type { FileUploadProvider, UploadedFile } from '../types.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/pdf',
	'text/plain',
	'audio/mpeg',
	'audio/wav',
	'video/mp4',
]);

const SUPPORTED_PROVIDERS: Set<string> = new Set<FileUploadProvider>(['openai', 'anthropic', 'google']);

interface ParsedMultipart {
	file?: UploadedFile;
	provider?: string;
}

async function parseMultipart(headers: IncomingHttpHeaders, stream: NodeJS.ReadableStream): Promise<ParsedMultipart> {
	return new Promise((resolve, reject) => {
		let file: UploadedFile | undefined;
		let provider: string | undefined;

		const bb = Busboy({
			headers: headers as Record<string, string>,
			limits: { fileSize: MAX_FILE_SIZE, files: 1 },
		});

		bb.on('file', (_name, fileStream, info) => {
			const chunks: Buffer[] = [];

			fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));

			fileStream.on('limit', () => {
				fileStream.destroy();
				reject(new InvalidPayloadError({ reason: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }));
			});

			fileStream.on('close', () => {
				file = {
					filename: info.filename || 'file',
					mimeType: info.mimeType,
					data: Buffer.concat(chunks),
				};
			});

			fileStream.on('error', reject);
		});

		bb.on('field', (name, value) => {
			if (name === 'provider') provider = value;
		});

		bb.on('close', () => resolve({ file, provider }));
		bb.on('error', reject);

		stream.pipe(bb);
	});
}

export const aiFileUploadHandler: RequestHandler = async (req, res, next) => {
	try {
		if (!req.accountability?.app) {
			throw new ForbiddenError();
		}

		const aiSettings = res.locals['ai']?.settings;

		if (!aiSettings) {
			throw new InvalidPayloadError({ reason: 'AI settings not loaded' });
		}

		const { file, provider } = await parseMultipart(req.headers, req);

		if (!file) {
			throw new InvalidPayloadError({ reason: 'No file provided' });
		}

		if (!provider) {
			throw new InvalidPayloadError({ reason: 'No provider specified' });
		}

		if (!SUPPORTED_PROVIDERS.has(provider)) {
			throw new InvalidPayloadError({
				reason:
					provider === 'openai-compatible'
						? 'File uploads not supported for openai-compatible provider'
						: `Unsupported provider: ${provider}`,
			});
		}

		if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
			throw new InvalidPayloadError({ reason: `Unsupported file type: ${file.mimeType}` });
		}

		const result = await uploadToProvider(file, provider as FileUploadProvider, aiSettings);

		res.json(result);
	} catch (error) {
		next(error);
	}
};
