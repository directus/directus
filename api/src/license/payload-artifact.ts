import { InvalidLicenseTokenError } from '@directus/errors';
import type { Knex } from 'knex';
import {
	getLicensePayloadCacheTtl,
	readCacheTokenPayload,
	writeCacheTokenPayload,
} from '../utils/cache-token-payload.js';
import { isLicenseVerificationUnavailableError, verify, verifyLocallyWithinGrace } from '../utils/verify-token.js';
import { getPayloadDisplayMetadata } from './display-metadata.js';
import { getEnvOfflinePayload } from './env.js';
import { getLicenseToken } from './storage.js';
import type {
	LicenseDisplayMetadata,
	LicenseGatePayloadState,
	LicenseGateSnapshot,
	LicenseTokenPayload,
} from './types.js';

type ResolveStoredLicensePayloadOptions = {
	knex?: Knex;
	mode?: 'local' | 'remote';
	previousSnapshot?: LicenseGateSnapshot | null;
};

type ResolvedStoredLicensePayload = {
	state: LicenseGatePayloadState;
	payload: LicenseTokenPayload | null;
	displayMetadata: LicenseDisplayMetadata | null;
};

export function isPayloadOutsideGrace(payload: LicenseTokenPayload | null | undefined): boolean {
	if (typeof payload?.exp !== 'number' || Number.isNaN(payload.exp)) {
		return false;
	}

	const gracePeriod = payload.metadata.grace_period ?? 0;

	if (typeof gracePeriod !== 'number' || Number.isNaN(gracePeriod)) {
		return false;
	}

	return Date.now() > payload.exp * 1000 + gracePeriod * 1000;
}

export function isSnapshotPayloadUsable(snapshot: LicenseGateSnapshot | null | undefined): boolean {
	if (!snapshot || (snapshot.payloadState !== 'valid' && snapshot.payloadState !== 'retained')) {
		return false;
	}

	if (snapshot.payload) {
		return !isPayloadOutsideGrace(snapshot.payload);
	}

	return !isSnapshotOutsideGrace(snapshot);
}

export function shouldRefreshSnapshotPayload(snapshot: LicenseGateSnapshot | null | undefined): boolean {
	if (!snapshot || (snapshot.payloadState !== 'valid' && snapshot.payloadState !== 'retained')) {
		return false;
	}

	if (snapshot.payload) {
		return isPayloadOutsideGrace(snapshot.payload);
	}

	return isSnapshotOutsideGrace(snapshot);
}

export async function resolveStoredLicensePayload(
	options?: ResolveStoredLicensePayloadOptions,
): Promise<ResolvedStoredLicensePayload> {
	const envPayload = await getEnvOfflinePayload();

	if (envPayload) {
		await writeCacheTokenPayload(envPayload, getLicensePayloadCacheTtl(envPayload));

		return {
			state: 'valid',
			payload: envPayload,
			displayMetadata: getPayloadDisplayMetadata(envPayload),
		};
	}

	const rawToken = await getLicenseToken(options?.knex);

	if (!rawToken) {
		return {
			state: 'missing',
			payload: null,
			displayMetadata: null,
		};
	}

	try {
		const payload = await verify(rawToken, options?.mode === 'local' ? { mode: 'local' } : undefined);
		await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));

		return {
			state: 'valid',
			payload,
			displayMetadata: getPayloadDisplayMetadata(payload),
		};
	} catch (error) {
		if (error instanceof InvalidLicenseTokenError) {
			try {
				const payload = await verifyLocallyWithinGrace(rawToken);
				await writeCacheTokenPayload(payload, getLicensePayloadCacheTtl(payload));

				return {
					state: 'valid',
					payload,
					displayMetadata: getPayloadDisplayMetadata(payload),
				};
			} catch (graceError) {
				if (!(graceError instanceof InvalidLicenseTokenError)) {
					throw new InvalidLicenseTokenError({}, { cause: graceError });
				}
			}
		}

		if (isLicenseVerificationUnavailableError(error)) {
			const retainedPayload =
				getSnapshotPayloadCandidate(options?.previousSnapshot) ?? (await getCachedPayloadCandidate());

			if (retainedPayload && !isPayloadOutsideGrace(retainedPayload)) {
				return {
					state: 'retained',
					payload: retainedPayload,
					displayMetadata: getPayloadDisplayMetadata(retainedPayload),
				};
			}
		}

		if (error instanceof InvalidLicenseTokenError || isLicenseVerificationUnavailableError(error)) {
			return {
				state: 'invalid',
				payload: null,
				displayMetadata: null,
			};
		}

		throw new InvalidLicenseTokenError({}, { cause: error });
	}
}

async function getCachedPayloadCandidate(): Promise<LicenseTokenPayload | null> {
	const cached = await readCacheTokenPayload();

	if (!cached) {
		return null;
	}

	return cached as LicenseTokenPayload;
}

function getSnapshotPayloadCandidate(snapshot: LicenseGateSnapshot | null | undefined): LicenseTokenPayload | null {
	return isSnapshotPayloadUsable(snapshot) ? (snapshot?.payload ?? null) : null;
}

function isSnapshotOutsideGrace(snapshot: LicenseGateSnapshot): boolean {
	if (typeof snapshot.tokenExpiresAt !== 'number' || Number.isNaN(snapshot.tokenExpiresAt)) {
		return false;
	}

	const gracePeriod = snapshot.gracePeriod ?? 0;

	if (typeof gracePeriod !== 'number' || Number.isNaN(gracePeriod)) {
		return false;
	}

	return Date.now() > snapshot.tokenExpiresAt * 1000 + gracePeriod * 1000;
}
