import type { Knex } from 'knex';
import { describe, expect, it, vi } from 'vitest';
import { getSettings } from './get-settings.js';

describe('getSettings', () => {
	it('should return settings when they exist in the database', async () => {
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockResolvedValue({
				project_id: 'test-project-id',
				mcp_enabled: true,
				mcp_allow_deletes: false,
				mcp_system_prompt_enabled: true,
				visual_editor_urls: '["https://example.com","https://example.org"]',
			}),
		} as unknown as Knex;

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
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockResolvedValue({
				project_id: 'test-project-id',
				// booleans omitted on purpose to ensure toBoolean handles undefined
				visual_editor_urls: null,
			}),
		} as unknown as Knex;

		const result = await getSettings(mockDb);

		expect(result).toEqual({
			project_id: 'test-project-id',
			mcp_enabled: false,
			mcp_allow_deletes: false,
			mcp_system_prompt_enabled: false,
			visual_editor_urls: 0,
		});
	});

	it('should handle unexpected database errors gracefully', async () => {
		const mockDb = {
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			first: vi.fn().mockRejectedValue(new Error('Database error')),
		} as unknown as Knex;

		await expect(getSettings(mockDb)).rejects.toThrow('Database error');
	});
});
