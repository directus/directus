import type { Knex } from 'knex';

/**
 * Settings that differ for new projects from what migrations give existing ones. Run once, right after a fresh
 * install's migrations, so upgrades keep their saved values.
 */
export async function applyNewProjectSettings(knex: Knex): Promise<void> {
	// MCP stays opt-in, but once it's on, clients sign in with OAuth and identify themselves with a metadata URL (CIMD)
	await knex('directus_settings').update({ mcp_oauth_enabled: true, mcp_oauth_cimd_enabled: true });
}
