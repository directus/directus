import type { TelemetryReport } from '../../types/report.js';

export function collectStorage(env: Record<string, unknown>): TelemetryReport['config']['storage'] {
	const drivers = new Set<string>();

	for (const [key, value] of Object.entries(env)) {
		if (key.startsWith('STORAGE_') && key.endsWith('_DRIVER') && value) {
			drivers.add(String(value));
		}
	}

	return { drivers: Array.from(drivers) };
}
