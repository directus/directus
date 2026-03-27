import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectPrometheus(env: Record<string, unknown>): TelemetryReport['config']['prometheus'] {
	return { enabled: toBoolean(env['METRICS_ENABLED']) };
}
