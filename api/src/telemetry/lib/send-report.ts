import { URL } from 'node:url';
import { useEnv } from '@directus/env';
import type { OwnerInformation } from '@directus/types';
import { getCurrentLicenseBinding } from '../../license/binding.js';
import { readLicenseGateSnapshot } from '../../license/cache-license-gate-snapshot.js';
import { getLocalLicensePayload } from '../../license/get-license-payload.js';
import { isSnapshotPayloadUsable } from '../../license/payload-artifact.js';
import { getRuntimeState } from '../../license/runtime.js';
import type { TelemetryReport } from '../types/report.js';

export type OwnerReport = OwnerInformation & { project_id: string; version: string };

/**
 * Post an anonymous usage report to the centralized intake server
 */
export const sendReport = async (report: TelemetryReport | OwnerReport) => {
	const env = useEnv();

	if (!('project_owner' in report) && !(await shouldSendTelemetryMetrics())) {
		return;
	}

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

async function shouldSendTelemetryMetrics(): Promise<boolean> {
	try {
		const snapshot = await readLicenseGateSnapshot();

		if (snapshot) {
			const runtime = getRuntimeState({
				terminal: snapshot.terminal,
				durableStatus: snapshot.durableStatus,
				payloadStatus: snapshot.payload?.metadata.status ?? snapshot.payloadStatus,
				tokenExpiresAt: snapshot.payload?.exp ?? snapshot.tokenExpiresAt,
				gracePeriod: snapshot.payload?.metadata.grace_period ?? snapshot.gracePeriod,
				hasValidPayload: isSnapshotPayloadUsable(snapshot),
			});

			if (runtime.canUsePayloadEntitlements && isSnapshotPayloadUsable(snapshot) && snapshot.payload) {
				return snapshot.payload.metadata.entitlements['analytics_opt_out_enabled'] !== true;
			}

			return true;
		}

		const [binding, payload] = await Promise.all([getCurrentLicenseBinding(), getLocalLicensePayload()]);
		const runtime = getRuntimeState({
			terminal: binding.terminal,
			durableStatus: binding.durableStatus,
			hasValidPayload: payload !== undefined,
			payloadStatus: payload?.metadata.status,
			tokenExpiresAt: payload?.exp,
			gracePeriod: payload?.metadata.grace_period,
		});

		if (runtime.canUsePayloadEntitlements && payload) {
			return payload.metadata.entitlements['analytics_opt_out_enabled'] !== true;
		}
	} catch {
		// Default to sending when licensing state can't be resolved.
	}

	return true;
}
