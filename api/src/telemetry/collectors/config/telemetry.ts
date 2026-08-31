import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectTelemetryConfig(env: Record<string, unknown>): TelemetryConfig['telemetry'] {
	return {
		// An instance entitled to telemetry_required still reports with this off, so the two together
		// show how often reporting is compelled rather than opted into.
		enabled: toBoolean(env['TELEMETRY'] ?? true),
		project_owner: toBoolean(env['PROJECT_OWNER_ENABLED'] ?? true),
	};
}
