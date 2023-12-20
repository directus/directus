import { URL } from 'node:url';
import { useEnv } from '../../env.js';
import type { TelemetryReport } from '../types/report.js';

/**
 * Post an anonymous usage report to the centralized intake server
 */
export const sendReport = async (report: TelemetryReport) => {
	const env = useEnv();

	const url = new URL('/metrics', env['TELEMETRY_INGRESS']);

	const headers: HeadersInit = {};

	if (env['TELEMETRY_AUTHORIZATION']) {
		headers['Authorization'] = env['TELEMETRY_AUTHORIZATION'];
	}

	await fetch(url, {
		method: 'POST',
		body: JSON.stringify(report),
		headers,
	});
};
