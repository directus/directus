import { describe, expect, test } from 'vitest';
import { collectMcp } from './mcp.js';

describe('collectMcp', () => {
	test('defaults mcp and its oauth flags off', () => {
		expect(collectMcp({})).toStrictEqual({ enabled: false, oauth: { enabled: false, dcr: false, cimd: false } });
	});

	test('reads oauth flags independently of mcp itself', () => {
		expect(collectMcp({ MCP_ENABLED: true, MCP_OAUTH_ENABLED: true, MCP_OAUTH_CIMD_ENABLED: true })).toStrictEqual({
			enabled: true,
			oauth: { enabled: true, dcr: false, cimd: true },
		});
	});
});
