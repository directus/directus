import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectRedis(env: Record<string, unknown>): TelemetryConfig['redis'] {
	return { enabled: toBoolean(env['REDIS_ENABLED']) };
}
