import { useEnv } from '@directus/env';
import { URL } from 'node:url';
import type { TelemetryReport } from '../types/report.js';

/**
 * Post an anonymous usage report to the centralized intake server
 */
export const sendReport = async (report: TelemetryReport) => {
	const env = useEnv();

	const url = new URL('/v1/metrics', env['TELEMETRY_URL'] as string);

	const headers: ResponseInit['headers'] = {
		'Content-Type': 'application/json',
	};

	if (env['TELEMETRY_AUTHORIZATION']) {
		headers['Authorization'] = env['TELEMETRY_AUTHORIZATION'] as string;
	}

	const res = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(report),
		headers,
	});

	if (!res.ok) {
		throw new Error(`[${res.status}] ${await res.text()}`);
	}
};
