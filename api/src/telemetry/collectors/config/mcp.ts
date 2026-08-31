import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectMcp(env: Record<string, unknown>): TelemetryConfig['mcp'] {
	return {
		enabled: toBoolean(env['MCP_ENABLED']),
		oauth: {
			enabled: toBoolean(env['MCP_OAUTH_ENABLED']),
			dcr: toBoolean(env['MCP_OAUTH_DCR_ENABLED']),
			cimd: toBoolean(env['MCP_OAUTH_CIMD_ENABLED']),
		},
	};
}
