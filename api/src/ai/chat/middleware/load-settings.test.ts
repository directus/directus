import type { Request, Response } from 'express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { loadSettings } from './load-settings.js';

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
	test('should load settings and set them in res.locals', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: 'test-openai-key',
			ai_anthropic_api_key: 'test-anthropic-key',
			ai_google_api_key: 'test-google-key',
			ai_openai_compatible_api_key: 'test-custom-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
			ai_openai_compatible_name: 'Ollama',
			ai_openai_compatible_models: [{ id: 'llama3', name: 'Llama 3' }],
			ai_openai_compatible_headers: [{ header: 'X-Custom', value: 'value' }],
			ai_openai_allowed_models: ['gpt-5'],
			ai_anthropic_allowed_models: ['claude-sonnet-4-5'],
			ai_google_allowed_models: null,
			ai_system_prompt: 'You are Directus.',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockGetSchema).toHaveBeenCalledTimes(1);

		expect(mockReadSingleton).toHaveBeenCalledWith({
			fields: [
				'ai_openai_api_key',
				'ai_anthropic_api_key',
				'ai_google_api_key',
				'ai_openai_compatible_api_key',
				'ai_openai_compatible_base_url',
				'ai_openai_compatible_name',
				'ai_openai_compatible_models',
				'ai_openai_compatible_headers',
				'ai_openai_allowed_models',
				'ai_anthropic_allowed_models',
				'ai_google_allowed_models',
				'ai_system_prompt',
			],
		});

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: 'test-openai-key',
					anthropicApiKey: 'test-anthropic-key',
					googleApiKey: 'test-google-key',
					openaiCompatibleApiKey: 'test-custom-key',
					openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
					openaiCompatibleName: 'Ollama',
					openaiCompatibleModels: [{ id: 'llama3', name: 'Llama 3' }],
					openaiCompatibleHeaders: [{ header: 'X-Custom', value: 'value' }],
					openaiAllowedModels: ['gpt-5'],
					anthropicAllowedModels: ['claude-sonnet-4-5'],
					googleAllowedModels: null,
					systemPrompt: 'You are Directus.',
				},
				systemPrompt: 'You are Directus.',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle missing settings with null defaults', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: undefined,
			ai_anthropic_api_key: undefined,
			ai_google_api_key: undefined,
			ai_openai_compatible_api_key: undefined,
			ai_openai_compatible_base_url: undefined,
			ai_openai_compatible_name: undefined,
			ai_openai_compatible_models: undefined,
			ai_openai_compatible_headers: undefined,
			ai_openai_allowed_models: undefined,
			ai_anthropic_allowed_models: undefined,
			ai_google_allowed_models: undefined,
			ai_system_prompt: undefined,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: null,
					anthropicApiKey: null,
					googleApiKey: null,
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
				systemPrompt: undefined,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle partial settings (only OpenAI)', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: 'test-openai-key',
			ai_anthropic_api_key: null,
			ai_google_api_key: null,
			ai_openai_compatible_api_key: null,
			ai_openai_compatible_base_url: null,
			ai_openai_compatible_name: null,
			ai_openai_compatible_models: null,
			ai_openai_compatible_headers: null,
			ai_openai_allowed_models: null,
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_system_prompt: 'System prompt here',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: 'test-openai-key',
					anthropicApiKey: null,
					googleApiKey: null,
					openaiCompatibleApiKey: null,
					openaiCompatibleBaseUrl: null,
					openaiCompatibleName: null,
					openaiCompatibleModels: null,
					openaiCompatibleHeaders: null,
					openaiAllowedModels: null,
					anthropicAllowedModels: null,
					googleAllowedModels: null,
					systemPrompt: 'System prompt here',
				},
				systemPrompt: 'System prompt here',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle OpenAI-compatible provider settings', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: null,
			ai_anthropic_api_key: null,
			ai_google_api_key: null,
			ai_openai_compatible_api_key: 'ollama-key',
			ai_openai_compatible_base_url: 'http://localhost:11434/v1',
			ai_openai_compatible_name: 'Ollama',
			ai_openai_compatible_models: [{ id: 'llama3', name: 'Llama 3', context: 8192 }],
			ai_openai_compatible_headers: null,
			ai_openai_allowed_models: null,
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_system_prompt: null,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: null,
					anthropicApiKey: null,
					googleApiKey: null,
					openaiCompatibleApiKey: 'ollama-key',
					openaiCompatibleBaseUrl: 'http://localhost:11434/v1',
					openaiCompatibleName: 'Ollama',
					openaiCompatibleModels: [{ id: 'llama3', name: 'Llama 3', context: 8192 }],
					openaiCompatibleHeaders: null,
					openaiAllowedModels: null,
					anthropicAllowedModels: null,
					googleAllowedModels: null,
					systemPrompt: null,
				},
				systemPrompt: null,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should throw error if database fails', async () => {
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
			ai_anthropic_api_key: null,
			ai_google_api_key: null,
			ai_openai_compatible_api_key: null,
			ai_openai_compatible_base_url: null,
			ai_openai_compatible_name: null,
			ai_openai_compatible_models: null,
			ai_openai_compatible_headers: null,
			ai_openai_allowed_models: null,
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_system_prompt: null,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		const { SettingsService } = await import('../../../services/settings.js');

		expect(SettingsService).toHaveBeenCalledWith({
			schema: mockSchema,
		});
	});

	test('should handle null values', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: null,
			ai_anthropic_api_key: null,
			ai_google_api_key: null,
			ai_openai_compatible_api_key: null,
			ai_openai_compatible_base_url: null,
			ai_openai_compatible_name: null,
			ai_openai_compatible_models: null,
			ai_openai_compatible_headers: null,
			ai_openai_allowed_models: null,
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_system_prompt: null,
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: null,
					anthropicApiKey: null,
					googleApiKey: null,
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
				systemPrompt: null,
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});

	test('should handle empty string values', async () => {
		mockReadSingleton.mockResolvedValue({
			ai_openai_api_key: '',
			ai_anthropic_api_key: '',
			ai_google_api_key: '',
			ai_openai_compatible_api_key: '',
			ai_openai_compatible_base_url: '',
			ai_openai_compatible_name: '',
			ai_openai_compatible_models: null,
			ai_openai_compatible_headers: null,
			ai_openai_allowed_models: null,
			ai_anthropic_allowed_models: null,
			ai_google_allowed_models: null,
			ai_system_prompt: '',
		});

		await loadSettings(mockRequest as Request, mockResponse as Response, nextFunction);

		expect(mockResponse.locals).toEqual({
			ai: {
				settings: {
					openaiApiKey: '',
					anthropicApiKey: '',
					googleApiKey: '',
					openaiCompatibleApiKey: '',
					openaiCompatibleBaseUrl: '',
					openaiCompatibleName: '',
					openaiCompatibleModels: null,
					openaiCompatibleHeaders: null,
					openaiAllowedModels: null,
					anthropicAllowedModels: null,
					googleAllowedModels: null,
					systemPrompt: '',
				},
				systemPrompt: '',
			},
		});

		expect(nextFunction).toHaveBeenCalledTimes(1);
	});
});
