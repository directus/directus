import type { TelemetryReport } from '../../types/report.js';

export function collectEmail(env: Record<string, unknown>): TelemetryReport['config']['email'] {
	return { transport: (env['EMAIL_TRANSPORT'] as string) ?? "sendmail" };
}
