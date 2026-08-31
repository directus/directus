import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectOpenapi(env: Record<string, unknown>): TelemetryConfig['openapi'] {
	return { enabled: toBoolean(env['OPENAPI_ENABLED']) };
}
