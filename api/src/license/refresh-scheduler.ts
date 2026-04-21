import { useEnv } from '@directus/env';
import { random } from 'lodash-es';
import { useLogger } from '../logger/index.js';
import {
	type ScheduledJob,
	scheduleSynchronizedJob,
	scheduleSynchronizedJobAt,
	validateCron,
} from '../utils/schedule.js';
import { getCurrentLicenseBinding } from './binding.js';
import { readLicenseGateSnapshot, refreshLicenseGateSnapshot } from './cache-license-gate-snapshot.js';
import { isEnvOffline } from './env.js';
import { getLocalLicensePayload } from './get-license-payload.js';
import { isSnapshotPayloadUsable, shouldRefreshSnapshotPayload } from './payload-artifact.js';
import { getRuntimeState } from './runtime.js';
import type { LicenseGateSnapshot, LicenseTokenPayload } from './types.js';

const env = useEnv();
const logger = useLogger();

const DEFAULT_CRON_TIME = `${random(59)} ${random(59)} */6 * * *`;
const MAX_REFRESH_INTERVAL_SECONDS = 604800;
const LICENSE_REFRESH_JOB_ID = 'license-check';

let activeLicenseRefreshJob: ScheduledJob | null = null;

export async function initializeLicenseRefreshSchedule(): Promise<void> {
	await recomputeLicenseRefreshSchedule();
}

export async function recomputeLicenseRefreshSchedule(options?: {
	payload?: LicenseTokenPayload | null;
}): Promise<void> {
	await stopLicenseRefreshSchedule();

	if (isEnvOffline()) {
		return;
	}

	const binding = await getCurrentLicenseBinding();
	const snapshot = await getSchedulingSnapshot();

	const runtime = getRuntimeState({
		terminal: snapshot?.terminal ?? binding.terminal,
		durableStatus: snapshot?.durableStatus ?? binding.durableStatus,
		payloadStatus: snapshot?.payload?.metadata.status ?? snapshot?.payloadStatus,
		tokenExpiresAt: snapshot?.payload?.exp ?? snapshot?.tokenExpiresAt,
		gracePeriod: snapshot?.payload?.metadata.grace_period ?? snapshot?.gracePeriod,
		hasValidPayload: isSnapshotPayloadUsable(snapshot),
	});

	let localPayload: LicenseTokenPayload | null = null;

	if (runtime.canSchedule) {
		if (options?.payload !== undefined) {
			localPayload = options.payload;
		} else if (snapshot?.payload && isSnapshotPayloadUsable(snapshot)) {
			localPayload = snapshot.payload;
		} else {
			localPayload = await getLocalSchedulingPayload();
		}
	}

	if (isOfflineToken(localPayload)) {
		return;
	}

	const scheduledAt = getScheduledRefreshAt(localPayload);

	if (scheduledAt) {
		activeLicenseRefreshJob = scheduleSynchronizedJobAt(LICENSE_REFRESH_JOB_ID, scheduledAt, async () => {
			await runSynchronizedLicenseRefresh();
		});

		return;
	}

	const cronTime = getFallbackCronTime();

	activeLicenseRefreshJob = scheduleSynchronizedJob(LICENSE_REFRESH_JOB_ID, cronTime, async () => {
		await runSynchronizedLicenseRefresh();
	});
}

export async function stopLicenseRefreshSchedule(): Promise<void> {
	if (!activeLicenseRefreshJob) return;

	await activeLicenseRefreshJob.stop();
	activeLicenseRefreshJob = null;
}

export function getFallbackCronTime(): string {
	const configuredCron = env['LICENSE_VALIDATE_SCHEDULE'] ? String(env['LICENSE_VALIDATE_SCHEDULE']) : null;

	if (configuredCron && validateCron(configuredCron)) {
		return configuredCron;
	}

	return DEFAULT_CRON_TIME;
}

export function getScheduledRefreshAt(payload: LicenseTokenPayload | null): Date | null {
	if (!payload || !isUsableRefreshInterval(payload.metadata.refresh_interval) || typeof payload.iat !== 'number') {
		return null;
	}

	return new Date(payload.iat * 1000 + payload.metadata.refresh_interval * 1000);
}

export function isUsableRefreshInterval(value: unknown): value is number {
	if (!Number.isInteger(value)) {
		return false;
	}

	const interval = value as number;
	return interval > 0 && interval <= MAX_REFRESH_INTERVAL_SECONDS;
}

export function isOfflineToken(payload: LicenseTokenPayload | null): boolean {
	return payload?.metadata.refresh_interval === 0;
}

async function getLocalSchedulingPayload(): Promise<LicenseTokenPayload | null> {
	try {
		return (await getLocalLicensePayload()) ?? null;
	} catch {
		return null;
	}
}

async function getSchedulingSnapshot(): Promise<LicenseGateSnapshot | undefined> {
	try {
		let snapshot = await readLicenseGateSnapshot();

		if (!snapshot || shouldRefreshSnapshotPayload(snapshot)) {
			snapshot = await refreshLicenseGateSnapshot();
		}

		return snapshot;
	} catch {
		return undefined;
	}
}

async function runSynchronizedLicenseRefresh(): Promise<void> {
	const { refreshLicense } = await import('./lifecycle.js');

	try {
		await refreshLicense({ mode: 'scheduled' });
	} catch (error) {
		logger.warn(error, '[license] Scheduled license validation failed');
		await recomputeLicenseRefreshSchedule({ payload: null });
	}
}
