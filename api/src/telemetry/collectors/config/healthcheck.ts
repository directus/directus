import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectHealthcheck(env: Record<string, unknown>): TelemetryConfig['healthcheck'] {
	return { enabled: toBoolean(env['HEALTHCHECK_ENABLED']) };
}
