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
	const stored = {
		ai_openai_api_key: 'test-openai-key',
		ai_anthropic_api_key: 'test-anthropic-key',
		ai_google_api_key: 'test-google-key',
		ai_openrouter_api_key: 'test-openrouter-key',
		ai_openai_compatible_api_key: 'test-custom-key',
		ai_openai_compatible_base_url: 'http://localhost:11434/v1',
		ai_openai_compatible_name: 'Ollama',
		ai_openai_compatible_models: [{ id: 'llama3', name: 'Llama 3' }],
		ai_openai_compatible_headers: [{ header: 'X-Custom', value: 'value' }],
		ai_openai_allowed_models: ['gpt-5'],
		ai_anthropic_allowed_models: ['claude-sonnet-4-5'],
		ai_google_allowed_models: null,
		ai_openrouter_models: [{ id: 'openai/gpt-6-luna', name: 'GPT-6 Luna' }],
		ai_system_prompt: 'You are Directus.',
	};

	test('should read the AI settings fields and return them as stored', async () => {
		mockReadSingleton.mockResolvedValue(stored);

		const settings = await getAISettings();

		expect(mockGetSchema).toHaveBeenCalledTimes(1);
		expect(mockReadSingleton).toHaveBeenCalledWith({ fields: Object.keys(stored) });
		expect(settings).toEqual(stored);
	});

	test('should keep empty strings as they are', async () => {
		mockReadSingleton.mockResolvedValue({ ai_openai_api_key: '', ai_system_prompt: '' });

		const settings = await getAISettings();

		expect(settings.ai_openai_api_key).toBe('');
		expect(settings.ai_system_prompt).toBe('');
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
