import type { Knex } from 'knex';
import { describe, expect, it, vi } from 'vitest';
import { SettingsService } from '../../services/settings.js';
import { type DatabaseSettings, getSettings, type TelemetrySettings } from './get-settings.js';

vi.mock('../../utils/get-schema.js');
vi.mock('../../services/settings.js');

const mockDb: Knex = {} as Knex;

describe('getSettings', () => {
	it('should return settings when they exist in the database', async () => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue({
			project_id: 'test-project-id',
			mcp_enabled: true,
			mcp_allow_deletes: false,
			mcp_system_prompt_enabled: true,
			visual_editor_urls: [{ url: 'https://example.com' }, { url: 'https://example.org' }],
			ai_openai_api_key: 'test-openai-key',
			ai_anthropic_api_key: 'test-anthropic-key',
			ai_system_prompt: 'test-system-prompt',
		} satisfies DatabaseSettings);

		const result = await getSettings(mockDb);

		expect(result).toEqual({
			project_id: 'test-project-id',
			mcp_enabled: true,
			mcp_allow_deletes: false,
			mcp_system_prompt_enabled: true,
			visual_editor_urls: 2,
			ai_openai_api_key: true,
			ai_anthropic_api_key: true,
			ai_system_prompt: true,
		} satisfies TelemetrySettings);
	});

	it('should coerce missing values to defaults when they are not set', async () => {
		vi.mocked(SettingsService.prototype.readSingleton).mockResolvedValue({
			project_id: 'test-project-id',
			// booleans omitted on purpose to ensure handles undefined
			visual_editor_urls: null,
		} as any);

		const result = await getSettings(mockDb);

		expect(result).toEqual({
			project_id: 'test-project-id',
			mcp_enabled: false,
			mcp_allow_deletes: false,
			mcp_system_prompt_enabled: false,
			visual_editor_urls: 0,
			ai_openai_api_key: false,
			ai_anthropic_api_key: false,
			ai_system_prompt: false,
		} satisfies TelemetrySettings);
	});
});
