import type { IncomingHttpHeaders } from 'node:http';
import { AI_ALLOWED_MIME_TYPES } from '@directus/ai';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import { useLogger } from '../../../logger/index.js';
import { uploadToProvider } from '../lib/upload-to-provider.js';
import type { FileUploadProvider, UploadedFile } from '../types.js';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES: Set<string> = new Set(AI_ALLOWED_MIME_TYPES);

const SUPPORTED_PROVIDERS = new Set<FileUploadProvider>(['openai', 'anthropic', 'google']);

function isSupportedProvider(provider: string): provider is FileUploadProvider {
	return SUPPORTED_PROVIDERS.has(provider as FileUploadProvider);
}

interface ParsedMultipart {
	file: UploadedFile | undefined;
	provider: string | undefined;
}

async function parseMultipart(headers: IncomingHttpHeaders, stream: NodeJS.ReadableStream): Promise<ParsedMultipart> {
	return new Promise((resolve, reject) => {
		let file: UploadedFile | undefined;
		let provider: string | undefined;
		let settled = false;

		const safeReject = (error: unknown) => {
			if (settled) return;
			settled = true;
			reject(error);
		};

		const bb = Busboy({
			headers: headers as Record<string, string>,
			limits: { fileSize: MAX_FILE_SIZE, files: 1 },
		});

		bb.on('file', (_name, fileStream, info) => {
			const chunks: Buffer[] = [];
			let exceeded = false;

			fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));

			fileStream.on('limit', () => {
				exceeded = true;
				fileStream.destroy();

				safeReject(
					new InvalidPayloadError({ reason: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` }),
				);
			});

			fileStream.on('close', () => {
				if (exceeded) return;

				file = {
					filename: info.filename || 'file',
					mimeType: info.mimeType,
					data: Buffer.concat(chunks),
				};
			});

			fileStream.on('error', safeReject);
		});

		bb.on('field', (name, value) => {
			if (name === 'provider') provider = value;
		});

		bb.on('close', () => {
			if (settled) return;
			settled = true;
			resolve({ file, provider });
		});

		bb.on('error', safeReject);

		stream.pipe(bb);
	});
}

export const aiFileUploadHandler: RequestHandler = async (req, res, next) => {
	const logger = useLogger();

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

		if (!isSupportedProvider(provider)) {
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

		const result = await uploadToProvider(file, provider, aiSettings);

		res.json(result);
	} catch (error) {
		if (error instanceof Error && !(error instanceof ForbiddenError) && !(error instanceof InvalidPayloadError)) {
			logger.error(error, 'AI file upload failed');
		}

		next(error);
	}
};
