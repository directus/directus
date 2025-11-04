import { useEnv } from '@directus/env';
import { URL } from 'node:url';
import type { TelemetryReport } from '../types/report.js';
import type { OwnerInformation } from '@directus/types';

export type OwnerReport = OwnerInformation & { project_id: string; version: string };

/**
 * Post an anonymous usage report to the centralized intake server
 */
export const sendReport = async (report: TelemetryReport | OwnerReport) => {
	const env = useEnv();

	const url =
		'project_owner' in report
			? new URL('/v1/owner', String(env['COMPLIANCE_URL']))
			: new URL('/v1/metrics', String(env['TELEMETRY_URL']));

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
