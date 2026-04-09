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

test('MCP OAuth env vars are listed in DIRECTUS_VARIABLES', () => {
	expect(DIRECTUS_VARIABLES).toContain('MCP_OAUTH_ENABLED');
	expect(DIRECTUS_VARIABLES).toContain('MCP_OAUTH_AUTH_CODE_TTL');
});
