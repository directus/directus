import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectWebsocket(env: Record<string, unknown>): TelemetryReport['config']['websockets'] {
	return {
		enabled: toBoolean(env['WEBSOCKETS_ENABLED']),
		rest: toBoolean(env['WEBSOCKETS_REST_ENABLED']),
		graphql: toBoolean(env['WEBSOCKETS_GRAPHQL_ENABLED']),
		logs: toBoolean(env['WEBSOCKETS_LOGS_ENABLED']),
	};
}
