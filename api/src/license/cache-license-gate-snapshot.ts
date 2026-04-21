import { InvalidLicenseTokenError } from '@directus/errors';
import type { Knex } from 'knex';
import { getCache, getCacheValue, setCacheValue } from '../cache.js';
import { getStoredLicenseDisplayMetadata } from './display-metadata.js';
import { resolveStoredLicensePayload } from './payload-artifact.js';
import { readLicenseState } from './storage.js';
import type { LicenseGateSnapshot } from './types.js';

const CACHE_KEY = 'license-gate-snapshot';

let inFlightRefresh: Promise<LicenseGateSnapshot> | null = null;

export async function readLicenseGateSnapshot(): Promise<LicenseGateSnapshot | undefined> {
	const { systemCache } = getCache();
	return (await getCacheValue(systemCache, CACHE_KEY)) as LicenseGateSnapshot | undefined;
}

export async function clearLicenseGateSnapshot(): Promise<void> {
	const { systemCache } = getCache();
	await systemCache.delete(CACHE_KEY);
}

export async function refreshLicenseGateSnapshot(knex?: Knex): Promise<LicenseGateSnapshot> {
	if (inFlightRefresh) {
		return await inFlightRefresh;
	}

	inFlightRefresh = (async () => {
		const previousSnapshot = await readLicenseGateSnapshot();
		const storedState = await readLicenseState(knex);

		const snapshot: LicenseGateSnapshot = {
			hasStoredLicenseKey: typeof storedState?.license_key === 'string' && storedState.license_key !== '',
			durableStatus: storedState?.license_status ?? null,
			terminal:
				storedState?.license_terminal_status === 'canceled' || storedState?.license_terminal_status === 'expired'
					? storedState.license_terminal_status
					: null,
			graceOn: storedState?.license_grace_on ?? null,
			payloadState: 'missing',
			payload: null,
			displayMetadata: null,
		};

		try {
			const resolved = await resolveStoredLicensePayload({ knex, previousSnapshot });
			snapshot.payloadState = resolved.state;
			snapshot.payload = resolved.payload;
			snapshot.displayMetadata = resolved.displayMetadata;
			snapshot.payloadStatus = resolved.payload?.metadata.status;
			snapshot.tokenExpiresAt = resolved.payload?.exp ?? null;
			snapshot.gracePeriod = resolved.payload?.metadata.grace_period ?? null;
		} catch (error) {
			if (!(error instanceof InvalidLicenseTokenError)) {
				throw error;
			}

			snapshot.payloadState = 'invalid';
		}

		if (!snapshot.displayMetadata && snapshot.terminal !== null) {
			snapshot.displayMetadata = (await getStoredLicenseDisplayMetadata(knex)) ?? null;
		}

		const { systemCache } = getCache();
		await setCacheValue(systemCache, CACHE_KEY, snapshot);
		return snapshot;
	})();

	try {
		return await inFlightRefresh;
	} finally {
		inFlightRefresh = null;
	}
}
