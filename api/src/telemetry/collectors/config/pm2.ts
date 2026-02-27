import type { TelemetryReport } from '../../types/report.js';

export function collectPm2(env: Record<string, unknown>): TelemetryReport['config']['pm2'] {
	const instances = Number(env['PM2_INSTANCES']);
	return { instances: Number.isFinite(instances) ? instances : 1 };
}
