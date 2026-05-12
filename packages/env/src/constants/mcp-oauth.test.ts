import { expect, test } from 'vitest';
import { DEFAULTS } from './defaults.js';
import { DIRECTUS_VARIABLES } from './directus-variables.js';
import { TYPE_MAP } from './type-map.js';

test('MCP_OAUTH_ENABLED defaults to false', () => {
	expect(DEFAULTS.MCP_OAUTH_ENABLED).toBe(false);
});

test('MCP_OAUTH_ENABLED is typed as boolean in TYPE_MAP', () => {
	expect(TYPE_MAP['MCP_OAUTH_ENABLED']).toBe('boolean');
});

test('MCP_OAUTH_AUTH_CODE_TTL defaults to 60s', () => {
	expect(DEFAULTS.MCP_OAUTH_AUTH_CODE_TTL).toBe('60s');
});

test('MCP_OAUTH_AUTH_CODE_TTL is typed as string in TYPE_MAP', () => {
	expect(TYPE_MAP['MCP_OAUTH_AUTH_CODE_TTL']).toBe('string');
});

test('MCP_OAUTH_CLIENT_UNUSED_TTL defaults to 24h', () => {
	expect(DEFAULTS.MCP_OAUTH_CLIENT_UNUSED_TTL).toBe('24h');
});

test('MCP_OAUTH_CLIENT_UNUSED_TTL is typed as string in TYPE_MAP', () => {
	expect(TYPE_MAP['MCP_OAUTH_CLIENT_UNUSED_TTL']).toBe('string');
});

test('MCP_OAUTH_CLIENT_IDLE_TTL is typed as string in TYPE_MAP', () => {
	expect(TYPE_MAP['MCP_OAUTH_CLIENT_IDLE_TTL']).toBe('string');
});

test('MCP OAuth env vars are listed in DIRECTUS_VARIABLES', () => {
	expect(DIRECTUS_VARIABLES).toEqual(
		expect.arrayContaining([
			'MCP_OAUTH_ENABLED',
			'MCP_OAUTH_AUTH_CODE_TTL',
			'MCP_OAUTH_MAX_CLIENTS',
			'MCP_OAUTH_CLIENT_UNUSED_TTL',
			'MCP_OAUTH_CLIENT_IDLE_TTL',
			'MCP_OAUTH_REQUIRE_RESOURCE',
			'MCP_OAUTH_CLEANUP_SCHEDULE',
			'MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS',
			'MCP_OAUTH_DCR_ENABLED',
			'MCP_OAUTH_CIMD_ENABLED',
			'MCP_OAUTH_CIMD_ALLOW_HTTP',
			'MCP_OAUTH_CIMD_ALLOWED_DOMAINS',
			'MCP_OAUTH_CIMD_BLOCKED_TLDS',
		]),
	);
});
