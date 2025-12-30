import { loadSettings } from './load-settings.js';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../services/settings.js');
vi.mock('../../../utils/get-schema.js');

const mockReadSingleton = vi.fn();
const mockGetSchema = vi.fn();

vi.mocked(await import('../../../services/settings.js')).SettingsService = vi.fn().mockImplementation(() => ({
	readSingleton: mockReadSingleton,
}));

vi.mocked(await import('../../../utils/get-schema.js')).getSchema = mockGetSchema;

let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
const nextFunction = vi.fn();

beforeEach(() => {
	mockRequest = {};

	mockResponse = {
		locals: {},
	};

	vi.clearAllMocks();
	mockGetSchema.mockResolvedValue({});
});

describe('loadSettings', () => {
	test('should load API keys from settings and set them in res.locals', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: 'test-openai-key',
			ai_anthropic_api_key: 'test-anthropic-key',
			ai_system_prompt: 'You are Directus.',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockGetSchema).toHaveBeenCalledTimes(1);

		expect(mockReadSingleton).toHaveBeenCalledWith({
			fields: ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_system_prompt'],
		});

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: 'test-openai-key',
					anthropic: 'test-anthropic-key',
				},
				systemPrompt: 'You are Directus.',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle missing API keys', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: undefined,
			ai_anthropic_api_key: undefined,
			ai_system_prompt: undefined,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockGetSchema).toHaveBeenCalledTimes(1);

		expect(mockReadSingleton).toHaveBeenCalledWith({
			fields: ['ai_openai_api_key', 'ai_anthropic_api_key', 'ai_system_prompt'],
		});

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: undefined,
					anthropic: undefined,
				},
				systemPrompt: undefined,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle partial API keys (only OpenAI)', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: 'test-openai-key',
			ai_anthropic_api_key: undefined,
			ai_system_prompt: 'System prompt here',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: 'test-openai-key',
					anthropic: undefined,
				},
				systemPrompt: 'System prompt here',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle partial API keys (only Anthropic)', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: undefined,
			ai_anthropic_api_key: 'test-anthropic-key',
			ai_system_prompt: undefined,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: undefined,
					anthropic: 'test-anthropic-key',
				},
				systemPrompt: undefined,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should call next() even if there is an error', async () => {
		const error = new Error('Database error');
		mockReadSingleton.mockRejectedValue(error);

		await expect(loadSettings(mockRequest as Request, mockResponse as Response, nextFunction)).rejects.toThrow(
			'Database error',
		);

		expect(mockGetSchema).toHaveBeenCalledTimes(1);
		expect(nextFunction).not.toHaveBeenCalled();
	});

	test('should create SettingsService with schema', async () => {
		const mockSchema = { collections: [], relations: [] };
		mockGetSchema.mockResolvedValue(mockSchema);

		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: 'test-key',
			ai_anthropic_api_key: 'test-key',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		const { SettingsService } = await import('../../../services/settings.js');

		expect(SettingsService).toHaveBeenCalledWith({
			schema: mockSchema,
		});
	});

	test('should handle null API keys', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: null,
			ai_anthropic_api_key: null,
			ai_system_prompt: null,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: null,
					anthropic: null,
				},
				systemPrompt: null,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle empty string API keys', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: '',
			ai_anthropic_api_key: '',
			ai_system_prompt: '',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				apiKeys: {
					openai: '',
					anthropic: '',
				},
				systemPrompt: '',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});
});
