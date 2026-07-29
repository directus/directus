import { URL } from 'node:url';
import { useEnv } from '@directus/env';
import type { OwnerInformation } from '@directus/types';
import { toBoolean } from '@directus/utils';
import type { TelemetryReport } from '../types/report.js';

export type OwnerReport = OwnerInformation & { project_id: string; version: string };

/**
 * Post an anonymous usage report to the centralized intake server
 */
export const sendReport = async (report: TelemetryReport | OwnerReport) => {
	const env = useEnv();

	const isOwnerReport = 'project_owner' in report;

	// Do not send any manually triggered owner reports if disabled
	if (toBoolean(env['PROJECT_OWNER_ENABLED']) === false && isOwnerReport) {
		return;
	}

	const url = isOwnerReport
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
