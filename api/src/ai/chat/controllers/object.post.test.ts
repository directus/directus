import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { generateText, jsonSchema } from 'ai';
import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildProviderConfigs, createAIProviderRegistry, getProviderOptions } from '../../providers/index.js';
import { aiObjectPostHandler } from './object.post.js';

vi.mock('ai', () => ({
	generateText: vi.fn(),
	jsonSchema: vi.fn((schema: unknown) => schema),
	Output: {
		object: vi.fn(({ schema }: { schema: unknown }) => ({ type: 'object', schema })),
	},
}));

vi.mock('../../providers/index.js', () => ({
	buildProviderConfigs: vi.fn(),
	createAIProviderRegistry: vi.fn(),
	getProviderOptions: vi.fn(),
}));

describe('aiObjectPostHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;
	let mockNext: NextFunction;

	const validBody = {
		provider: 'openai',
		model: 'gpt-5',
		prompt: 'Extract the name and age',
		outputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'number' },
			},
			required: ['name', 'age'],
		},
	};

	beforeEach(() => {
		mockNext = vi.fn();

		mockReq = {
			body: { ...validBody },
			accountability: { user: 'test-user', role: 'test-role', app: true } as any,
			schema: { collections: {}, relations: {} } as any,
		} as any;

		mockRes = {
			locals: {
				ai: {
					settings: {
						openaiApiKey: 'test-openai-key',
						anthropicApiKey: 'test-anthropic-key',
						googleApiKey: null,
						openaiCompatibleApiKey: null,
						openaiCompatibleBaseUrl: null,
						openaiCompatibleName: null,
						openaiCompatibleModels: null,
						openaiCompatibleHeaders: null,
						openaiAllowedModels: ['gpt-5', 'gpt-5-mini'],
						anthropicAllowedModels: ['claude-sonnet-4-5'],
						googleAllowedModels: ['gemini-2.5-pro'],
						systemPrompt: null,
					},
				},
			},
		} as any;

		vi.mocked(buildProviderConfigs).mockReturnValue([{ type: 'openai', apiKey: 'test-key' }]);

		vi.mocked(createAIProviderRegistry).mockReturnValue({
			languageModel: vi.fn(() => 'mock-model'),
		} as any);

		vi.mocked(getProviderOptions).mockReturnValue({});

		vi.mocked(generateText).mockResolvedValue({
			output: { name: 'John', age: 30 },
		} as any);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			delete (mockReq as any).accountability;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when app is false', async () => {
			mockReq.accountability = { user: 'test', role: 'test', app: false } as any;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when provider is missing', async () => {
			mockReq.body = { model: 'gpt-5', prompt: 'test', outputSchema: validBody.outputSchema };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when prompt is missing', async () => {
			mockReq.body = { provider: 'openai', model: 'gpt-5', outputSchema: validBody.outputSchema };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when outputSchema is missing', async () => {
			mockReq.body = { provider: 'openai', model: 'gpt-5', prompt: 'test' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});

		it('should throw InvalidPayloadError when provider is invalid', async () => {
			mockReq.body = { ...validBody, provider: 'invalid-provider' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				InvalidPayloadError,
			);
		});
	});

	describe('model validation', () => {
		it('should throw ForbiddenError when model is not in allowed list', async () => {
			mockReq.body = { ...validBody, model: 'not-allowed' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when allowedModels is null', async () => {
			mockRes.locals!['ai'].settings.openaiAllowedModels = null;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should throw ForbiddenError when allowedModels is empty', async () => {
			mockRes.locals!['ai'].settings.openaiAllowedModels = [];

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ForbiddenError,
			);
		});

		it('should not validate openai-compatible models', async () => {
			vi.mocked(buildProviderConfigs).mockReturnValue([
				{ type: 'openai-compatible', apiKey: 'test', baseUrl: 'http://localhost' },
			]);

			mockReq.body = { ...validBody, provider: 'openai-compatible', model: 'any-model' };

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockNext).toHaveBeenCalled();
		});
	});

	describe('provider configuration', () => {
		it('should throw ServiceUnavailableError when provider has no API key', async () => {
			vi.mocked(buildProviderConfigs).mockReturnValue([]);

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ServiceUnavailableError,
			);
		});
	});

	describe('structured output generation', () => {
		it('should call generateText with correct parameters', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(generateText)).toHaveBeenCalledWith(
				expect.objectContaining({
					model: 'mock-model',
					prompt: validBody.prompt,
					output: expect.any(Object),
					providerOptions: {},
				}),
			);
		});

		it('should pass maxOutputTokens when provided', async () => {
			mockReq.body = { ...validBody, maxOutputTokens: 1024 };

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(vi.mocked(generateText)).toHaveBeenCalledWith(
				expect.objectContaining({
					maxOutputTokens: 1024,
				}),
			);
		});

		it('should inject additionalProperties: false into the output schema', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const schemaArg = vi.mocked(jsonSchema).mock.calls[0]![0] as Record<string, unknown>;
			expect(schemaArg).toHaveProperty('additionalProperties', false);
		});

		it('should not pass maxOutputTokens when not provided', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			const callArgs = vi.mocked(generateText).mock.calls[0]![0] as Record<string, unknown>;
			expect(callArgs).not.toHaveProperty('maxOutputTokens');
		});
	});

	describe('response handling', () => {
		it('should set payload with generated object and call next', async () => {
			const generatedObject = { name: 'Jane', age: 25 };
			vi.mocked(generateText).mockResolvedValue({ output: generatedObject } as any);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext);

			expect(mockRes.locals!['payload']).toEqual({ data: generatedObject });
			expect(mockNext).toHaveBeenCalled();
		});

		it('should throw ServiceUnavailableError when output is undefined', async () => {
			vi.mocked(generateText).mockResolvedValue({ output: undefined } as any);

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ServiceUnavailableError,
			);
		});

		it('should propagate errors from generateText', async () => {
			vi.mocked(generateText).mockRejectedValue(new Error('rate limit exceeded'));

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				'rate limit exceeded',
			);
		});

		it('should throw ServiceUnavailableError when output is null', async () => {
			vi.mocked(generateText).mockResolvedValue({ output: null } as any);

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response, mockNext)).rejects.toThrow(
				ServiceUnavailableError,
			);
		});
	});
});
