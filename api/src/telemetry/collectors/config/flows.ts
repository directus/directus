import type { TelemetryConfig } from '../../types/report.js';
import { numberOrNull, stringOrNull } from '../../utils/env-value.js';

export function collectFlowsConfig(env: Record<string, unknown>): TelemetryConfig['flows'] {
	return {
		run_script_timeout: numberOrNull(env['FLOWS_RUN_SCRIPT_TIMEOUT']),
		run_script_max_memory: stringOrNull(env['FLOWS_RUN_SCRIPT_MAX_MEMORY']),
	};
}
