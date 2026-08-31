import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';
import { stringOrNull } from '../../utils/env-value.js';

export function collectAi(env: Record<string, unknown>): TelemetryConfig['ai'] {
	return {
		enabled: toBoolean(env['AI_ENABLED']),
		devtools: toBoolean(env['AI_DEVTOOLS_ENABLED']),
		telemetry: {
			enabled: toBoolean(env['AI_TELEMETRY_ENABLED']),
			provider: stringOrNull(env['AI_TELEMETRY_PROVIDER']),
		},
	};
}
