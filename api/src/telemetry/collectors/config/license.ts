import { toBoolean } from '@directus/utils';
import type { TelemetryConfig } from '../../types/report.js';

export function collectLicenseConfig(env: Record<string, unknown>): TelemetryConfig['license'] {
	return { key_management: toBoolean(env['LICENSE_KEY_MANAGEMENT_ENABLED']) };
}
