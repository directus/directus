import type { Knex } from 'knex';
import { describe, expect, it, vi } from 'vitest';
import { getSettings } from './get-settings.js';
import { SettingsService } from '@/services/settings.js';

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
			visual_editor_urls: ['https://example.com', 'https://example.org'],
		} as any);

		const result = await getSettings(mockDb);

		expect(result).toEqual({
			project_id: 'test-project-id',
			mcp_enabled: true,
			mcp_allow_deletes: false,
			mcp_system_prompt_enabled: true,
			visual_editor_urls: 2,
		});
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
		});
	});
});
