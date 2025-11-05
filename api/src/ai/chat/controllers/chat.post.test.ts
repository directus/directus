import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiChatPostHandler } from './chat.post.js';

// Mock dependencies
vi.mock('ai', () => ({
	safeValidateUIMessages: vi.fn(),
}));

vi.mock('../lib/create-ui-stream.js', () => ({
	createUiStream: vi.fn(),
}));

vi.mock('../utils/chat-request-tool-to-ai-sdk-tool.js', () => ({
	chatRequestToolToAiSdkTool: vi.fn(),
}));

import { safeValidateUIMessages } from 'ai';
import { createUiStream } from '../lib/create-ui-stream.js';
import { chatRequestToolToAiSdkTool } from '../utils/chat-request-tool-to-ai-sdk-tool.js';

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

		vi.mocked(createUiStream).mockImplementation(() => mockStream as any);

		vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((tool: any) => ({ tool }) as any);

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

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(ForbiddenError);
		});

		it('should throw ForbiddenError when accountability is null', async () => {
			mockReq.accountability = null as any;

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(ForbiddenError);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when provider is missing', async () => {
			mockReq.body = {
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when model is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				messages: [{ role: 'user', content: 'Hello' }],
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when messages is missing', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				tools: [],
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
				tools: [],
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
				tools: [],
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
				tools: [],
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
				tools: [],
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
				tools: [],
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
				tools: [],
			};

			await expect(aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn())).rejects.toThrow(
				InvalidPayloadError,
			);

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({
				messages: [{ role: 'invalid', content: 'test' }],
				tools: {},
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
				tools: [],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn());

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({ messages, tools: {} });
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
				tools: [],
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn());

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith('openai', 'gpt-5', expect.any(Array), {}, customApiKeys);
		});
	});

	describe('tools mapping', () => {
		it('should transform provided tools and pass them to validation and stream', async () => {
			const tools = [
				'search',
				{
					name: 'custom',
					description: 'Custom tool',
					inputSchema: { type: 'object', properties: { q: { type: 'string' } }, required: ['q'] },
				},
			];

			// Map tool name to a distinct mock tool value for easier assertions
			vi.mocked(chatRequestToolToAiSdkTool).mockImplementation((t: any) => {
				const name = typeof t === 'string' ? t : t.name;
				return { name, mocked: true } as any;
			});

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-5',
				messages: [{ role: 'user', content: 'Hello' }],
				tools,
			};

			await aiChatPostHandler(mockReq as Request, mockRes as Response, vi.fn());

			const expectedTools = {
				search: { name: 'search', mocked: true },
				custom: { name: 'custom', mocked: true },
			};

			expect(vi.mocked(safeValidateUIMessages)).toHaveBeenCalledWith({
				messages: [{ role: 'user', content: 'Hello' }],
				tools: expectedTools,
			});

			expect(vi.mocked(createUiStream)).toHaveBeenCalledWith(
				'openai',
				'gpt-5',
				expect.any(Array),
				expectedTools,
				mockRes.locals!['ai'].apiKeys,
			);
		});
	});
});
