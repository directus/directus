import { afterEach, describe, expect, test, vi } from 'vitest';
import { collectFeatures } from './features.js';

vi.mock('@directus/ai', () => ({
	DEFAULT_AI_MODELS: [
		{ provider: 'openai', model: 'gpt-5' },
		{ provider: 'anthropic', model: 'claude-sonnet-4-5' },
		{ provider: 'google', model: 'gemini-2.5-pro' },
	],
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({ AI_ENABLED: false }),
}));

vi.mock('../../services/settings.js', () => ({
	SettingsService: vi.fn().mockImplementation(() => ({
		readSingleton: vi.fn().mockResolvedValue({}),
	})),
}));

vi.mock('../utils/collect-installed-registry-extensions.js', () => ({
	collectInstalledRegistryExtensions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../utils/count-custom-models.js', () => ({
	countCustomModels: vi.fn().mockReturnValue(0),
}));

vi.mock('../utils/filter-known-array-items.js', () => ({
	filterKnownArrayItems: vi.fn().mockReturnValue([]),
}));

import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { SettingsService } from '../../services/settings.js';

afterEach(() => {
	vi.clearAllMocks();
});

describe('collectFeatures', () => {
	const mockDb = {} as Knex;
	const mockSchema = {} as SchemaOverview;

	test('returns all feature sections', async () => {
		const result = await collectFeatures(mockDb, mockSchema);

		expect(result).toHaveProperty('mcp');
		expect(result).toHaveProperty('ai');
		expect(result).toHaveProperty('modules');
		expect(result).toHaveProperty('visual_editor');
		expect(result).toHaveProperty('files');
		expect(result).toHaveProperty('collaborative_editing');
		expect(result).toHaveProperty('mapping');
		expect(result).toHaveProperty('image_editor');
		expect(result).toHaveProperty('extensions');
		expect(result).toHaveProperty('appearance');
	});

	test('defaults mcp fields to false', async () => {
		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.mcp).toEqual({ enabled: false, allow_deletes: false, system_prompt: false });
	});

	test('reads settings via SettingsService', async () => {
		await collectFeatures(mockDb, mockSchema);
		expect(SettingsService).toHaveBeenCalled();
	});

	test('detects enabled modules from module_bar', async () => {
		vi.mocked(SettingsService).mockImplementation(() => ({
			readSingleton: vi.fn().mockResolvedValue({
				module_bar: [
					{ type: 'module', id: 'content', enabled: true },
					{ type: 'module', id: 'visual', enabled: true },
					{ type: 'module', id: 'files', enabled: false },
				],
			}),
		}) as any);

		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.modules.content).toBe(true);
		expect(result.modules.visual_editor).toBe(true);
		expect(result.modules.files).toBe(false);
	});

	test('defaults content/files/users/insights/settings to true when module_bar is empty', async () => {
		vi.mocked(SettingsService).mockImplementation(() => ({
			readSingleton: vi.fn().mockResolvedValue({}),
		}) as any);

		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.modules.content).toBe(true);
		expect(result.modules.files).toBe(true);
		expect(result.modules.users).toBe(true);
		expect(result.modules.insights).toBe(true);
		expect(result.modules.settings).toBe(true);
		expect(result.modules.visual_editor).toBe(false);
		expect(result.modules.deployments).toBe(false);
	});

	test('returns ai provider structure', async () => {
		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.ai.providers).toHaveProperty('openai');
		expect(result.ai.providers).toHaveProperty('anthropic');
		expect(result.ai.providers).toHaveProperty('google');
		expect(result.ai.providers).toHaveProperty('openai_compatible');
	});

	test('counts openai_compatible models from settings array', async () => {
		vi.mocked(SettingsService).mockImplementation(() => ({
			readSingleton: vi.fn().mockResolvedValue({
				ai_openai_compatible_models: [{ id: 'model-1' }, { id: 'model-2' }],
			}),
		}) as any);

		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.ai.providers.openai_compatible.models.count).toBe(2);
	});

	test('defaults transformations to all', async () => {
		const result = await collectFeatures(mockDb, mockSchema);
		expect(result.files.transformations).toBe('all');
	});


});
