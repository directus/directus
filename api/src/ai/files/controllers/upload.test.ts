import { Readable } from 'node:stream';
import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadToProvider } from '../lib/upload-to-provider.js';
import { aiFileUploadHandler } from './upload.js';

vi.mock('../lib/upload-to-provider.js', () => ({
	uploadToProvider: vi.fn(),
}));

function createMockMultipartRequest(fields: Record<string, string>, file?: { name: string; data: Buffer; type: string }) {
	const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
	const parts: string[] = [];

	for (const [key, value] of Object.entries(fields)) {
		parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}`);
	}

	if (file) {
		parts.push(
			`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n`,
		);
	}

	const bodyStart = parts.join('\r\n') + '\r\n';
	const bodyEnd = `\r\n--${boundary}--\r\n`;

	const chunks: Buffer[] = [Buffer.from(bodyStart)];

	if (file) {
		chunks.push(file.data);
	}

	chunks.push(Buffer.from(bodyEnd));
	const body = Buffer.concat(chunks);

	const stream = new Readable({
		read() {
			this.push(body);
			this.push(null);
		},
	});

	return {
		stream,
		headers: {
			'content-type': `multipart/form-data; boundary=${boundary}`,
			'content-length': String(body.length),
		},
	};
}

describe('aiFileUploadHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockNext = vi.fn();

		mockRes = {
			locals: {
				ai: {
					settings: {
						openaiApiKey: 'test-openai-key',
						anthropicApiKey: 'test-anthropic-key',
						googleApiKey: 'test-google-key',
						openaiCompatibleApiKey: null,
						openaiCompatibleBaseUrl: null,
						openaiCompatibleName: null,
						openaiCompatibleModels: null,
						openaiCompatibleHeaders: null,
						openaiAllowedModels: null,
						anthropicAllowedModels: null,
						googleAllowedModels: null,
						systemPrompt: null,
					},
				},
			},
			json: vi.fn(),
		} as any;

		vi.mocked(uploadToProvider).mockResolvedValue({
			provider: 'openai',
			fileId: 'file-abc123',
			filename: 'test.pdf',
			mimeType: 'application/pdf',
			sizeBytes: 12,
			expiresAt: null,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: null as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
		});

		it('should throw ForbiddenError when app access is false', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: false } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
		});
	});

	describe('validation', () => {
		it('should throw InvalidPayloadError when no file provided', async () => {
			const { stream, headers } = createMockMultipartRequest({ provider: 'openai' });

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('No file provided');
		});

		it('should throw InvalidPayloadError when no provider specified', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{},
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('No provider specified');
		});

		it('should throw InvalidPayloadError for unsupported provider', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'invalid-provider' },
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('Unsupported provider');
		});

		it('should throw InvalidPayloadError for openai-compatible provider', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai-compatible' },
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('File uploads not supported for openai-compatible');
		});

		it('should throw InvalidPayloadError for unsupported MIME type', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'test.exe', data: Buffer.from('test'), type: 'application/x-msdownload' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('Unsupported file type');
		});

		it('should throw InvalidPayloadError when AI settings not loaded', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'test.pdf', data: Buffer.from('test'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			mockRes.locals = {};

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith(expect.any(InvalidPayloadError));

			const error = (mockNext as any).mock.calls[0][0];
			expect(error.message).toContain('AI settings not loaded');
		});
	});

	describe('successful upload', () => {
		it('should upload PDF file to OpenAI', async () => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'test.pdf', data: Buffer.from('pdf content'), type: 'application/pdf' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(uploadToProvider).toHaveBeenCalledWith(
				expect.objectContaining({
					filename: 'test.pdf',
					mimeType: 'application/pdf',
				}),
				'openai',
				mockRes.locals!['ai'].settings,
			);

			expect(mockRes.json).toHaveBeenCalledWith({
				provider: 'openai',
				fileId: 'file-abc123',
				filename: 'test.pdf',
				mimeType: 'application/pdf',
				sizeBytes: 12,
				expiresAt: null,
			});
		});

		it('should upload image file to Anthropic', async () => {
			vi.mocked(uploadToProvider).mockResolvedValue({
				provider: 'anthropic',
				fileId: 'file_ant123',
				filename: 'image.png',
				mimeType: 'image/png',
				sizeBytes: 100,
				expiresAt: null,
			});

			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'anthropic' },
				{ name: 'image.png', data: Buffer.from('png data'), type: 'image/png' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(uploadToProvider).toHaveBeenCalledWith(
				expect.objectContaining({
					mimeType: 'image/png',
				}),
				'anthropic',
				expect.any(Object),
			);
		});

		it('should upload file to Google with expiration', async () => {
			vi.mocked(uploadToProvider).mockResolvedValue({
				provider: 'google',
				fileId: 'https://example.com/files/abc',
				filename: 'video.mp4',
				mimeType: 'video/mp4',
				sizeBytes: 1000,
				expiresAt: '2025-01-03T00:00:00Z',
			});

			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'google' },
				{ name: 'video.mp4', data: Buffer.from('mp4 data'), type: 'video/mp4' },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRes.json).toHaveBeenCalledWith(
				expect.objectContaining({
					expiresAt: '2025-01-03T00:00:00Z',
				}),
			);
		});
	});

	describe('MIME type validation', () => {
		const validTypes = [
			'image/jpeg',
			'image/png',
			'image/gif',
			'image/webp',
			'application/pdf',
			'text/plain',
			'audio/mpeg',
			'audio/wav',
			'video/mp4',
		];

		it.each(validTypes)('should accept %s', async (mimeType) => {
			const { stream, headers } = createMockMultipartRequest(
				{ provider: 'openai' },
				{ name: 'file', data: Buffer.from('test'), type: mimeType },
			);

			mockReq = {
				headers,
				accountability: { user: 'test', role: 'test', app: true } as any,
				pipe: stream.pipe.bind(stream),
			} as any;

			await aiFileUploadHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(uploadToProvider).toHaveBeenCalled();
		});
	});
});
