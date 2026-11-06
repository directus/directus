import { DEFAULT_ALLOWED_MODELS } from '@directus/ai';
import type { SchemaOverview } from '@directus/types';
import knexFactory from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getAISettings } from './settings.js';

// Mock dependencies
vi.mock('../../services/settings.js');
vi.mock('../../utils/get-schema.js');

const mockReadSingleton = vi.fn();
const mockGetSchema = vi.fn();

vi.mocked(await import('../../services/settings.js')).SettingsService = vi.fn().mockImplementation(function () {
	return {
		readSingleton: mockReadSingleton,
	};
});

vi.mocked(await import('../../utils/get-schema.js')).getSchema = mockGetSchema;

beforeEach(() => {
	vi.clearAllMocks();
	mockGetSchema.mockResolvedValue({});
});

describe('getAISettings', () => {
	test('should load and map AI settings', async () => {
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

		const settings = await getAISettings();

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

		expect(settings).toEqual({
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
			googleAllowedModels: DEFAULT_ALLOWED_MODELS.google,
			systemPrompt: 'You are Directus.',
		});
	});

	test('should keep an empty allowed models list instead of falling back to defaults', async () => {
		mockReadSingleton.mockResolvedValue({ ai_openai_allowed_models: [] });

		const settings = await getAISettings();

		expect(settings.openaiAllowedModels).toEqual([]);
		expect(settings.anthropicAllowedModels).toEqual(DEFAULT_ALLOWED_MODELS.anthropic);
	});

	test.each([
		['missing', {}],
		['null', { ai_openai_api_key: null, ai_openai_compatible_models: null, ai_system_prompt: null }],
	])('should use null and the default allowed models for %s settings', async (_, stored) => {
		mockReadSingleton.mockResolvedValue(stored);

		expect(await getAISettings()).toEqual({
			openaiApiKey: null,
			anthropicApiKey: null,
			googleApiKey: null,
			openaiCompatibleApiKey: null,
			openaiCompatibleBaseUrl: null,
			openaiCompatibleName: null,
			openaiCompatibleModels: null,
			openaiCompatibleHeaders: null,
			openaiAllowedModels: DEFAULT_ALLOWED_MODELS.openai,
			anthropicAllowedModels: DEFAULT_ALLOWED_MODELS.anthropic,
			googleAllowedModels: DEFAULT_ALLOWED_MODELS.google,
			systemPrompt: null,
		});
	});

	test('should keep empty strings as they are', async () => {
		mockReadSingleton.mockResolvedValue({ ai_openai_api_key: '', ai_system_prompt: '' });

		const settings = await getAISettings();

		expect(settings.openaiApiKey).toBe('');
		expect(settings.systemPrompt).toBe('');
	});

	test('should throw error if database fails', async () => {
		mockReadSingleton.mockRejectedValue(new Error('Database error'));

		await expect(getAISettings()).rejects.toThrow('Database error');
	});

	test("should read as the system, with the caller's database and schema when given", async () => {
		const { SettingsService } = await import('../../services/settings.js');
		const globalSchema: SchemaOverview = { collections: {}, relations: [] };
		const schema: SchemaOverview = { collections: {}, relations: [] };
		const knex = knexFactory({ client: MockClient });

		mockGetSchema.mockResolvedValue(globalSchema);
		mockReadSingleton.mockResolvedValue({});

		await getAISettings();
		expect(mockGetSchema).toHaveBeenLastCalledWith(undefined);
		expect(SettingsService).toHaveBeenLastCalledWith({ schema: globalSchema, accountability: null });

		await getAISettings({ knex });
		expect(mockGetSchema).toHaveBeenLastCalledWith({ database: knex });
		expect(SettingsService).toHaveBeenLastCalledWith({ schema: globalSchema, knex, accountability: null });

		await getAISettings({ knex, schema });
		expect(SettingsService).toHaveBeenLastCalledWith({ schema, knex, accountability: null });
		expect(mockGetSchema).toHaveBeenCalledTimes(2);
	});
});
