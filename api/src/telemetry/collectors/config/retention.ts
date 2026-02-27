import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectRetention(env: Record<string, unknown>): TelemetryReport['config']['retention'] {
	return {
		enabled: toBoolean(env['RETENTION_ENABLED']),
		activity: (env['ACTIVITY_RETENTION'] as string) ?? false,
		revisions: (env['REVISIONS_RETENTION'] as string) ?? false,
		flow_logs: (env['FLOW_LOGS_RETENTION'] as string) ?? false,
	};
}
