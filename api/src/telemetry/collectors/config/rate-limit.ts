import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectRateLimit(env: Record<string, unknown>): TelemetryReport['config']['rate_limiting'] {
	return {
		enabled: toBoolean(env['RATE_LIMITER_ENABLED']),
		pressure: toBoolean(env['PRESSURE_LIMITER_ENABLED']),
		email: toBoolean(env['RATE_LIMITER_EMAIL_ENABLED']),
		email_flows: toBoolean(env['RATE_LIMITER_EMAIL_FLOWS_ENABLED']),
	};
}
