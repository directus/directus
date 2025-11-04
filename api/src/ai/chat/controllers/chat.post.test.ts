import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiChatPostHandler } from './chat.post.js';

// Mock dependencies
vi.mock('ai', () => ({
	safeValidateUIMessages: vi.fn(),
}));

vi.mock('../create-ui-stream.js', () => ({
	createUiStream: vi.fn(),
}));

import { safeValidateUIMessages } from 'ai';
import { createUiStream } from '../lib/create-ui-stream.js';

describe('aiChatPostHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockStream: { pipeUIMessageStreamToResponse: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		mockStream = {
			pipeUIMessageStreamToResponse: vi.fn(),
		};

		mockReq = {
			body: {},
			accountability: { user: 'test-user', role: 'test-role' } as any,
		} as any;

		mockRes = {
			locals: {
				ai: {
					apiKeys: {
						openai: 'test-openai-key',
						anthropic: 'test-anthropic-key',
					},
				},
			},
		} as any;

		vi.mocked(createUiStream).mockReturnValue(mockStream as any);

		vi.mocked(safeValidateUIMessages).mockResolvedValue({
			success: true,
			data: [{ role: 'user', content: 'test message' }],
		} as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication and authorization', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			delete (mockReq as any).accountability;

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when accountability is null', async () => {
			mockReq.accountability = null as any;

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				ForbiddenError,
			);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when provider is missing', async () => {
			mockReq.body = {
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when model is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when provider is invalid', async () => {
			mockReq.body = {
				provider: 'invalid-provider',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when openai model is invalid', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'invalid-model',
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when anthropic model is invalid', async () => {
			mockReq.body = {
				provider: 'anthropic',
				model: 'invalid-model',
				messages: [{ role: 'user', content: 'Hello' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages is not an array', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: 'not-an-array',
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages array is empty', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);

			expect(vi.mocked(safeValidateUIMessages)).not.toHaveBeenCalled();
		});
	});

	describe('message validation', () => {
		it('should throw InvalidPayloadError when safeValidateUIMessages fails', async () => {
			const errorMessage = 'Invalid message format';

			vi.mocked(safeValidateUIMessages).mockResolvedValue({
				success: false,
				error: new Error(errorMessage),
			} as any);

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'invalid', content: 'test' }],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({
				messages: [{ role: 'invalid', content: 'test' }],
			});
		});

		it('should call safeValidateUIMessages with correct messages', async () => {
			const messages = [
				{ role: 'user', content: 'Hello' },
				{ role: 'assistant', content: 'Hi there' },
			];

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages,
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn());

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({ messages });
		});
	});

	describe('api keys handling', () => {
		it('should pass api keys from res.locals to createUiStream', async () => {
			const customApiKeys = {
				openai: 'custom-openai-key',
				anthropic: 'custom-anthropic-key',
			};

			mockRes.locals = {
				ai: {
					apiKeys: customApiKeys,
				},
			};

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'test' }],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn());

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith('openai', 'gpt-5', expect.any(Array), customApiKeys);
		});
	});
});
