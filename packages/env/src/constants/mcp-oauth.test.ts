import { expect, test } from 'vitest';
import { DEFAULTS } from './defaults.js';

test('MCP OAuth registration modes default to disabled', () => {
	expect(DEFAULTS.MCP_OAUTH_DCR_ENABLED).toBe(false);
	expect(DEFAULTS.MCP_OAUTH_CIMD_ENABLED).toBe(false);
});
