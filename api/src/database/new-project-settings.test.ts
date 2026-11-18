import { expect, test, vi } from 'vitest';
import { applyNewProjectSettings } from './new-project-settings.js';

test('turns on MCP OAuth with CIMD and leaves DCR and MCP itself alone', async () => {
	const update = vi.fn();
	const knex = vi.fn(() => ({ update }));

	await applyNewProjectSettings(knex as any);

	expect(knex).toHaveBeenCalledWith('directus_settings');
	expect(update).toHaveBeenCalledWith({ mcp_oauth_enabled: true, mcp_oauth_cimd_enabled: true });
});
