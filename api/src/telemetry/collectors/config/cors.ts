import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectCors(env: Record<string, unknown>): TelemetryConfig['cors'] {
	return { enabled: toBoolean(env['CORS_ENABLED']) };
}
