import { expect, test } from 'vitest';
import { DEFAULTS } from './defaults.js';

test('MCP OAuth registration modes default to disabled', () => {
	expect(DEFAULTS.MCP_OAUTH_DCR_ENABLED).toBe(false);
	expect(DEFAULTS.MCP_OAUTH_CIMD_ENABLED).toBe(false);
});

test('MCP OAuth custom desktop redirects default to Raycast and Cursor', () => {
	expect(DEFAULTS.MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS).toBe(
		'raycast://oauth,cursor://cursor.mcp,cursor://anysphere.cursor-mcp',
	);
});
