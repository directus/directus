import { ForbiddenError, InvalidPayloadError, ServiceUnavailableError } from '@directus/errors';
import { jsonSchema, streamObject } from 'ai';
import { MockLanguageModelV3 } from 'ai/test';
import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveLanguageModel } from '../../providers/resolve-model.js';
import { getAITelemetryConfig } from '../../telemetry/index.js';
import { aiObjectPostHandler } from './object.post.js';

const mockPipeTextStreamToResponse = vi.fn();
const mockModel = new MockLanguageModelV3();

vi.mock('ai', () => ({
	streamObject: vi.fn(() => ({ pipeTextStreamToResponse: mockPipeTextStreamToResponse })),
	jsonSchema: vi.fn((schema: unknown) => schema),
}));

vi.mock('../../providers/resolve-model.js', () => ({
	resolveLanguageModel: vi.fn(),
}));

vi.mock('../../telemetry/index.js', () => ({
	getAITelemetryConfig: vi.fn(),
}));

describe('aiObjectPostHandler', () => {
	let mockReq: Partial<Request>;
	let mockRes: Partial<Response>;

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
		mockReq = {
			body: { ...validBody },
			accountability: { user: 'test-user', role: 'test-role', app: true } as any,
			schema: { collections: {}, relations: {} } as any,
		} as any;

		mockRes = {
			locals: {
				ai: {
					settings: {
						ai_openai_api_key: 'test-openai-key',
						ai_anthropic_api_key: 'test-anthropic-key',
						ai_google_api_key: null,
						ai_openrouter_api_key: null,
						ai_openai_compatible_api_key: null,
						ai_openai_compatible_base_url: null,
						ai_openai_compatible_name: null,
						ai_openai_compatible_models: null,
						ai_openai_compatible_headers: null,
						ai_openai_allowed_models: ['gpt-5', 'gpt-5-mini'],
						ai_anthropic_allowed_models: ['claude-sonnet-4-5'],
						ai_google_allowed_models: ['gemini-2.5-pro'],
						ai_openrouter_models: [{ id: 'anthropic/claude-sonnet-5.5', name: 'Claude Sonnet 5.5' }],
						ai_system_prompt: null,
					},
				},
			},
		} as any;

		vi.mocked(resolveLanguageModel).mockReturnValue({ model: mockModel, providerOptions: {} });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('authentication', () => {
		it('should throw ForbiddenError when accountability is missing', async () => {
			delete (mockReq as any).accountability;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(ForbiddenError);
		});

		it('should throw ForbiddenError when app is false', async () => {
			mockReq.accountability = { user: 'test', role: 'test', app: false } as any;

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(ForbiddenError);
		});
	});

	describe('input validation', () => {
		it('should throw InvalidPayloadError when provider is missing', async () => {
			mockReq.body = { model: 'gpt-5', prompt: 'test', outputSchema: validBody.outputSchema };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(InvalidPayloadError);
		});

		it('should throw InvalidPayloadError when prompt is missing', async () => {
			mockReq.body = { provider: 'openai', model: 'gpt-5', outputSchema: validBody.outputSchema };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(InvalidPayloadError);
		});

		it('should throw InvalidPayloadError when outputSchema is missing', async () => {
			mockReq.body = { provider: 'openai', model: 'gpt-5', prompt: 'test' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(InvalidPayloadError);
		});

		it('should throw InvalidPayloadError when provider is invalid', async () => {
			mockReq.body = { ...validBody, provider: 'invalid-provider' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(InvalidPayloadError);
		});
	});

	describe('model validation', () => {
		it('should not stream when resolveLanguageModel rejects the model', async () => {
			vi.mocked(resolveLanguageModel).mockImplementation(() => {
				throw new ForbiddenError({ reason: 'Model not allowed for this provider' });
			});

			mockReq.body = { ...validBody, model: 'not-allowed' };

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(ForbiddenError);
			expect(resolveLanguageModel).toHaveBeenCalledWith('openai', 'not-allowed', mockRes.locals!['ai'].settings);
			expect(streamObject).not.toHaveBeenCalled();
		});
	});

	describe('provider configuration', () => {
		it('should throw ServiceUnavailableError when provider has no API key', async () => {
			vi.mocked(resolveLanguageModel).mockImplementation(() => {
				throw new ServiceUnavailableError({ service: 'openai', reason: 'No API key configured for AI provider' });
			});

			await expect(aiObjectPostHandler(mockReq as Request, mockRes as Response)).rejects.toThrow(
				ServiceUnavailableError,
			);
		});
	});

	describe('streaming output generation', () => {
		it('should call streamObject with correct parameters', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			expect(resolveLanguageModel).toHaveBeenCalledWith('openai', 'gpt-5', mockRes.locals!['ai'].settings);

			expect(vi.mocked(streamObject)).toHaveBeenCalledWith(
				expect.objectContaining({
					model: mockModel,
					prompt: validBody.prompt,
					providerOptions: {},
				}),
			);
		});

		it('should pass maxOutputTokens when provided', async () => {
			mockReq.body = { ...validBody, maxOutputTokens: 1024 };

			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			expect(vi.mocked(streamObject)).toHaveBeenCalledWith(
				expect.objectContaining({
					maxOutputTokens: 1024,
				}),
			);
		});

		it('should inject additionalProperties: false into the output schema', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			const schemaArg = vi.mocked(jsonSchema).mock.calls[0]![0] as Record<string, unknown>;
			expect(schemaArg).toHaveProperty('additionalProperties', false);
		});

		it('should pass experimental_telemetry when telemetry is configured', async () => {
			const mockTelemetryConfig = { isEnabled: true, functionId: 'directus-ai-object' };
			vi.mocked(getAITelemetryConfig).mockReturnValue(mockTelemetryConfig);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			expect(vi.mocked(getAITelemetryConfig)).toHaveBeenCalledWith(
				{ provider: 'openai', model: 'gpt-5', userId: 'test-user', role: 'test-role' },
				'directus-ai-object',
			);

			expect(vi.mocked(streamObject)).toHaveBeenCalledWith(
				expect.objectContaining({
					experimental_telemetry: mockTelemetryConfig,
				}),
			);
		});

		it('should not pass experimental_telemetry when telemetry is not configured', async () => {
			vi.mocked(getAITelemetryConfig).mockReturnValue(undefined);

			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			const callArgs = vi.mocked(streamObject).mock.calls[0]![0] as Record<string, unknown>;
			expect(callArgs).not.toHaveProperty('experimental_telemetry');
		});

		it('should not pass maxOutputTokens when not provided', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			const callArgs = vi.mocked(streamObject).mock.calls[0]![0] as Record<string, unknown>;
			expect(callArgs).not.toHaveProperty('maxOutputTokens');
		});
	});

	describe('response handling', () => {
		it('should pipe the stream to the response', async () => {
			await aiObjectPostHandler(mockReq as Request, mockRes as Response);

			expect(mockPipeTextStreamToResponse).toHaveBeenCalledWith(mockRes);
		});
	});
});
