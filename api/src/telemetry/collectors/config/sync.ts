import type { TelemetryReport } from '../../types/report.js';

export function collectSyncStore(env: Record<string, unknown>): TelemetryReport['config']['synchronization'] {
	const store = (env['SYNCHRONIZATION_STORE'] as string) ?? 'memory';
	return { store };
}
