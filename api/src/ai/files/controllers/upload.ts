import type { IncomingHttpHeaders } from 'node:http';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import Busboy from 'busboy';
import type { RequestHandler } from 'express';
import { uploadToProvider } from '../lib/upload-to-provider.js';
import type { FileUploadProvider, UploadedFile } from '../types.js';

// Use highest provider limit for busboy, validate per-provider after parsing
const MAX_FILE_SIZE = 512 * 1024 * 1024; // 512MB (OpenAI limit - highest for non-Google)

// Per-provider file size limits for non-image files (PDFs, text, audio, video)
// OpenAI: 512MB - https://platform.openai.com/docs/api-reference/files
// Anthropic: 500MB - https://docs.anthropic.com/en/docs/build-with-claude/files
// Google: 2GB - https://ai.google.dev/gemini-api/docs/files
const PROVIDER_FILE_LIMITS: Record<string, number> = {
	openai: 512 * 1024 * 1024, // 512MB
	anthropic: 500 * 1024 * 1024, // 500MB
	google: 2 * 1024 * 1024 * 1024, // 2GB
};

// Per-provider image size limits (vision/Messages API limits, not Files API limits)
// These are the actual usable limits when the image is used for vision
// OpenAI: 50MB total payload - https://platform.openai.com/docs/guides/vision
// Anthropic: 5MB per image - https://docs.anthropic.com/en/docs/build-with-claude/vision
// Google: 20MB inline - https://ai.google.dev/gemini-api/docs/vision
const PROVIDER_IMAGE_LIMITS: Record<string, number> = {
	openai: 50 * 1024 * 1024, // 50MB total payload
	anthropic: 5 * 1024 * 1024, // 5MB per image
	google: 20 * 1024 * 1024, // 20MB inline
};

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

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

const SUPPORTED_PROVIDERS = new Set(['openai', 'anthropic', 'google']);

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

		// Validate file size against provider-specific limits
		const isImage = IMAGE_MIME_TYPES.has(file.mimeType);

		const effectiveLimit = isImage
			? (PROVIDER_IMAGE_LIMITS[provider] ?? MAX_FILE_SIZE)
			: (PROVIDER_FILE_LIMITS[provider] ?? MAX_FILE_SIZE);

		if (file.data.length > effectiveLimit) {
			const limitMB = Math.round(effectiveLimit / (1024 * 1024));
			throw new InvalidPayloadError({
				reason: `File size exceeds ${provider} limit of ${limitMB}MB${isImage ? ' for images' : ''}`,
			});
		}

		const result = await uploadToProvider(file, provider as FileUploadProvider, aiSettings);

		res.json(result);
	} catch (error) {
		next(error);
	}
};
