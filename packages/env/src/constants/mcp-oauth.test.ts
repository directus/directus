import { expect, test } from 'vitest';
import { DEFAULTS } from './defaults.js';

test('MCP OAuth defaults to on with CIMD, and DCR off', () => {
	expect(DEFAULTS.MCP_OAUTH_ENABLED).toBe(true);
	expect(DEFAULTS.MCP_OAUTH_CIMD_ENABLED).toBe(true);
	expect(DEFAULTS.MCP_OAUTH_DCR_ENABLED).toBe(false);
});

test('MCP OAuth custom desktop redirects default to Raycast and Cursor', () => {
	expect(DEFAULTS.MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS).toEqual([
		'raycast://oauth',
		'cursor://cursor.mcp',
		'cursor://anysphere.cursor-mcp',
	]);
});
