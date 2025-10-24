import { useEnv } from '@directus/env';
import type { OwnerInformation } from '@directus/types';
import { URL } from 'node:url';

/**
 * Post owner report to the centralized intake server
 */
export async function sendOwnerReport(report: OwnerInformation) {
	const env = useEnv();

	const url = new URL('/v1/owner', env['TELEMETRY_URL'] as string);

	const headers: ResponseInit['headers'] = {
		'Content-Type': 'application/json',
	};

	if (env['TELEMETRY_AUTHORIZATION']) {
		headers['Authorization'] = env['TELEMETRY_AUTHORIZATION'] as string;
	}

	await fetch(url, {
		method: 'POST',
		body: JSON.stringify(report),
		headers,
	});
}
