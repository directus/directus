import { expect, test } from 'vitest';
import { DEFAULTS } from './defaults.js';

test('MCP OAuth registration modes default to disabled', () => {
	expect(DEFAULTS.MCP_OAUTH_DCR_ENABLED).toBe(false);
	expect(DEFAULTS.MCP_OAUTH_CIMD_ENABLED).toBe(false);
});

test('MCP OAuth runtime endpoints use a shared rate limiter pool by default', () => {
	expect(DEFAULTS.RATE_LIMITER_MCP_OAUTH_ENABLED).toBe(true);
	expect(DEFAULTS.RATE_LIMITER_MCP_OAUTH_POINTS).toBe(60);
	expect(DEFAULTS.RATE_LIMITER_MCP_OAUTH_DURATION).toBe(60);
	expect(DEFAULTS).not.toHaveProperty('RATE_LIMITER_MCP_OAUTH_AUTHORIZE_ENABLED');
});
