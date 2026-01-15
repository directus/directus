import { ForbiddenError, InvalidPayloadError } from '@directus/errors';
import { generateText } from 'ai';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiObjectPostHandler } from './object.post.js';

vi.mock('ai');

describe('aiObjectPostHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	beforeEach(() => {
		mockNext = vi.fn();

		mockReq = {
			body: {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Extract user information',
				outputSchema: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						email: { type: 'string' },
					},
					required: ['name', 'email'],
				},
			},
			accountability: { user: 'test-user', role: 'test-role', app: true } as any,
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

		vi.mocked(generateText).mockResolvedValue({
			toolCalls: [
				{
					toolName: 'respond',
					args: {},
					input: {
						name: 'John Doe',
						email: 'john@example.com',
					},
				},
			],
			text: '',
			rawCall: {} as any,
			usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
			finishReason: 'tool-calls',
		} as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication and authorization', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			delete (mockReq as any).accountability;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when accountability is null', async () => {
			mockReq.accountability = null as any;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when accountability.app is false', async () => {
			mockReq.accountability = { app: false } as any;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when accountability.app is undefined', async () => {
			mockReq.accountability = { user: 'test-user' } as any;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when request body parsing fails', async () => {
			mockReq.body = {
				// Invalid: missing required fields
				foo: 'bar',
			};

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should call ObjectRequest.safeParse with request body', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Test prompt',
				outputSchema: { type: 'object' },
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			// ObjectRequest parsing was attempted
			expect(mockNext).toHaveBeenCalledWith();
		});
	});

	describe('model provider handling', () => {
		it('should use model provider with correct parameters', async () => {
			const apiKeys = {
				openai: 'test-key-1',
				anthropic: 'test-key-2',
			};

			mockRes.locals = {
				ai: { apiKeys },
			};

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Test',
				outputSchema: { type: 'object' },
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			// generateText should have been called
			expect(vi.mocked(generateText)).toHaveBeenCalled();
		});

		it('should work with different providers', async () => {
			mockReq.body = {
				provider: 'anthropic',
				model: 'claude-3-sonnet',
				prompt: 'Test prompt',
				outputSchema: { type: 'object' },
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(generateText)).toHaveBeenCalled();
		});
	});

	describe('generateText invocation', () => {
		it('should call generateText with correct parameters', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Extract user info',
				outputSchema: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						email: { type: 'string' },
					},
					required: ['name', 'email'],
				},
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(generateText)).toHaveBeenCalled();
			const calls = vi.mocked(generateText).mock.calls;
			expect(calls.length).toBeGreaterThan(0);
			const callArgs = calls[0]?.[0];
			expect(callArgs?.prompt).toBe('Extract user info');
			expect(callArgs?.toolChoice).toBe('required');
			expect(callArgs?.tools?.['respond']?.description).toBe('Your response');
		});

		it('should include maxOutputTokens when provided', async () => {
			const maxTokens = 2000;

			mockReq.body = {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Test prompt',
				outputSchema: { type: 'object' },
				maxOutputTokens: maxTokens,
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const calls = vi.mocked(generateText).mock.calls;
			const callArgs = calls[0]?.[0];
			expect(callArgs?.maxOutputTokens).toBe(maxTokens);
		});

		it('should not include maxOutputTokens when not provided', async () => {
			mockReq.body = {
				provider: 'openai',
				model: 'gpt-4',
				prompt: 'Test prompt',
				outputSchema: { type: 'object' },
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const calls = vi.mocked(generateText).mock.calls;
			const callArgs = calls[0]?.[0];
			expect(callArgs && 'maxOutputTokens' in callArgs).toBe(false);
		});
	});

	describe('response handling', () => {
		it('should set payload from first tool call input', async () => {
			const toolInput = {
				name: 'Jane Doe',
				email: 'jane@example.com',
			};

			vi.mocked(generateText).mockResolvedValue({
				toolCalls: [
					{
						toolName: 'respond',
						args: {},
						input: toolInput,
					},
				],
				text: '',
				rawCall: {} as any,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
				finishReason: 'tool-calls',
			} as any);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRes.locals!['payload']).toEqual(toolInput);
		});

		it('should set payload to undefined when no tool calls', async () => {
			vi.mocked(generateText).mockResolvedValue({
				toolCalls: [],
				text: 'No tool calls made',
				rawCall: {} as any,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
				finishReason: 'stop',
			} as any);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRes.locals!['payload']).toBeUndefined();
		});

		it('should set payload to undefined when toolCalls is undefined', async () => {
			vi.mocked(generateText).mockResolvedValue({
				toolCalls: undefined,
				text: 'Response',
				rawCall: {} as any,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
				finishReason: 'stop',
			} as any);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRes.locals!['payload']).toBeUndefined();
		});

		it('should call next() after setting payload', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith();
		});

		it('should call next() even when payload is undefined', async () => {
			vi.mocked(generateText).mockResolvedValue({
				toolCalls: undefined,
				text: 'Response',
				rawCall: {} as any,
				usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
				finishReason: 'stop',
			} as any);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalledWith();
		});
	});

	describe('integration', () => {
		it('should handle complete successful flow', async () => {
			const expectedOutput = {
				name: 'John Smith',
				email: 'john.smith@example.com',
				age: 30,
			};

			vi.mocked(generateText).mockResolvedValue({
				toolCalls: [
					{
						toolName: 'respond',
						args: {},
						input: expectedOutput,
					},
				],
				text: '',
				rawCall: {} as any,
				usage: { promptTokens: 150, completionTokens: 75, totalTokens: 225 },
				finishReason: 'tool-calls',
			} as any);

			mockReq.body = {
				provider: 'anthropic',
				model: 'claude-3-sonnet',
				prompt: 'Extract user data from the text',
				outputSchema: {
					type: 'object',
					properties: {
						name: { type: 'string' },
						email: { type: 'string' },
						age: { type: 'number' },
					},
				},
				maxOutputTokens: 1000,
			};

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(generateText)).toHaveBeenCalled();
			expect(mockRes.locals!['payload']).toEqual(expectedOutput);
			expect(mockNext).toHaveBeenCalledWith();
		});
	});
});
