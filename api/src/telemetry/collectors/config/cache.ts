import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../../types/report.js';

export function collectCache(env: Record<string, unknown>): TelemetryReport['config']['cache'] {
	return {
		enabled: toBoolean(env['CACHE_ENABLED']),
		store: (env['CACHE_STORE'] as string) ?? "memory",
	};
}
