import { isSystemCollection } from '@directus/system-data';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { useLogger } from '../logger/index.js';
import { fetchUserCount, getUserSeatsCount } from '../utils/fetch-user-count/fetch-user-count.js';
import { getCurrentLicenseBinding } from './binding.js';
import {
	readLicenseFallbackCompliance,
	refreshLicenseFallbackCompliance,
} from './cache-license-fallback-compliance.js';
import { readLicenseGateSnapshot, refreshLicenseGateSnapshot } from './cache-license-gate-snapshot.js';
import { graceEntitlements } from './defaults.js';
import { getStoredLicenseDisplayMetadata } from './display-metadata.js';
import { normalizeLicenseEntitlements } from './entitlements.js';
import { getEnvLicense } from './env.js';
import { isOnboardingGraceActive } from './license-status.js';
import { getNumericEntitlementLimit } from './numeric-gate.js';
import {
	isSnapshotPayloadUsable,
	resolveStoredLicensePayload,
	shouldRefreshSnapshotPayload,
} from './payload-artifact.js';
import { getRuntimeState, getTerminalMode } from './runtime.js';
import type {
	DerivedLicenseStatus,
	LicenseDisplayMetadata,
	LicenseEntitlements,
	LicenseGateSnapshot,
	LicenseGraceType,
	LicensePayloadStatus,
	LicenseSource,
} from './types.js';

const logger = useLogger();

type LicenseStateSummary = {
	source: LicenseSource;
	showLicenseKeyField: boolean;
	displayMetadata: LicenseDisplayMetadata | null;
	displayStatus: LicensePayloadStatus | null;
	status: DerivedLicenseStatus;
	locked: boolean;
	graceType: LicenseGraceType;
};

type LicenseUsageSummary = {
	collections: {
		current: number;
	};
	seats: {
		current: number;
		remaining: number | null;
	};
};

export async function getLicenseStateSummary(knex?: Knex): Promise<LicenseStateSummary> {
	const envLicense = getEnvLicense();
	let snapshot = await readLicenseGateSnapshot();

	if (!snapshot || shouldRefreshSnapshotPayload(snapshot)) {
		try {
			snapshot = await refreshLicenseGateSnapshot(knex);
		} catch (error) {
			logger.warn(error, '[license] Failed to refresh cached license gate snapshot');
		}
	}

	if (snapshot) {
		return await getLicenseStateSummaryFromSnapshot(snapshot, envLicense, knex);
	}

	return await getLicenseStateSummaryUncached(knex);
}

async function getLicenseStateSummaryFromSnapshot(
	snapshot: LicenseGateSnapshot,
	envLicense: ReturnType<typeof getEnvLicense>,
	knex?: Knex,
): Promise<LicenseStateSummary> {
	const terminalMode = getTerminalMode({
		terminal: snapshot.terminal,
		durableStatus: snapshot.durableStatus,
	});

	const hasValidPayload = isSnapshotPayloadUsable(snapshot);
	let isFallbackCompliant: boolean | undefined;

	if (
		terminalMode !== 'hard' &&
		(!hasValidPayload || terminalMode === 'recovered') &&
		(snapshot.durableStatus === 'active' || snapshot.durableStatus === 'deactivated') &&
		!isOnboardingGraceActive(snapshot.graceOn)
	) {
		const cachedFallback = await readLicenseFallbackCompliance();

		if (typeof cachedFallback === 'boolean') {
			isFallbackCompliant = cachedFallback;
		} else {
			try {
				isFallbackCompliant = await refreshLicenseFallbackCompliance(knex ?? getDatabase());
			} catch (error) {
				isFallbackCompliant = false;
				logger.warn(error, '[license] Failed to assess fallback compliance');
			}
		}
	}

	const runtime = getRuntimeState({
		terminal: snapshot.terminal,
		durableStatus: snapshot.durableStatus,
		payloadStatus: snapshot.payload?.metadata.status ?? snapshot.payloadStatus,
		tokenExpiresAt: snapshot.payload?.exp ?? snapshot.tokenExpiresAt,
		gracePeriod: snapshot.payload?.metadata.grace_period ?? snapshot.gracePeriod,
		graceOn: snapshot.graceOn,
		hasValidPayload,
		isFallbackCompliant,
	});

	let source: LicenseSource = null;

	if (envLicense.source === 'env') {
		source = 'env';
	} else if (snapshot.hasStoredLicenseKey) {
		source = 'settings';
	}

	return {
		source,
		showLicenseKeyField: envLicense.source !== 'env',
		displayMetadata: snapshot.displayMetadata,
		displayStatus: getDisplayStatus(snapshot.displayMetadata, snapshot.terminal),
		status: runtime.status,
		locked: runtime.locked,
		graceType: runtime.graceType,
	};
}

async function getLicenseStateSummaryUncached(knex?: Knex): Promise<LicenseStateSummary> {
	const binding = await getCurrentLicenseBinding(knex);

	const terminalMode = getTerminalMode({
		terminal: binding.terminal,
		durableStatus: binding.durableStatus,
	});

	const resolved = await resolveStoredLicensePayload(knex ? { knex } : undefined);
	let displayMetadata = resolved.displayMetadata;

	if (!displayMetadata && terminalMode !== null) {
		displayMetadata = (await getStoredLicenseDisplayMetadata(knex)) ?? null;
	}

	const runtime = getRuntimeState({
		terminal: binding.terminal,
		durableStatus: binding.durableStatus,
		payloadStatus: resolved.payload?.metadata.status,
		tokenExpiresAt: resolved.payload?.exp,
		gracePeriod: resolved.payload?.metadata.grace_period,
		graceOn: binding.graceOn,
		hasValidPayload: resolved.state === 'valid' || resolved.state === 'retained',
		isFallbackCompliant:
			terminalMode === 'hard'
				? undefined
				: await resolveFallbackCompliance(
						!resolved.payload || terminalMode === 'recovered' ? binding.durableStatus : null,
						binding.graceOn,
						knex,
					),
	});

	return {
		source: binding.source,
		showLicenseKeyField: binding.source !== 'env',
		displayMetadata,
		displayStatus: getDisplayStatus(displayMetadata, binding.terminal),
		status: runtime.status,
		locked: runtime.locked,
		graceType: runtime.graceType,
	};
}

function getDisplayStatus(
	metadata: LicenseDisplayMetadata | null,
	terminal: 'canceled' | 'expired' | null,
): LicensePayloadStatus | null {
	return terminal ?? metadata?.status ?? null;
}

async function resolveFallbackCompliance(
	durableStatus: LicenseGateSnapshot['durableStatus'],
	graceOn: LicenseGateSnapshot['graceOn'],
	knex?: Knex,
): Promise<boolean | undefined> {
	if (!(durableStatus === 'active' || durableStatus === 'deactivated') || isOnboardingGraceActive(graceOn)) {
		return undefined;
	}

	const cachedFallback = await readLicenseFallbackCompliance();

	if (typeof cachedFallback === 'boolean') {
		return cachedFallback;
	}

	try {
		return await refreshLicenseFallbackCompliance(knex ?? getDatabase());
	} catch (error) {
		logger.warn(error, '[license] Failed to assess fallback compliance');
		return false;
	}
}

export async function getLicenseEntitlements(knex?: Knex): Promise<LicenseEntitlements> {
	try {
		let snapshot = await readLicenseGateSnapshot();

		if (!snapshot || shouldRefreshSnapshotPayload(snapshot)) {
			snapshot = await refreshLicenseGateSnapshot(knex);
		}

		const runtime = getRuntimeState({
			terminal: snapshot?.terminal ?? null,
			durableStatus: snapshot?.durableStatus ?? null,
			payloadStatus: snapshot?.payload?.metadata.status ?? snapshot?.payloadStatus,
			tokenExpiresAt: snapshot?.payload?.exp ?? snapshot?.tokenExpiresAt,
			gracePeriod: snapshot?.payload?.metadata.grace_period ?? snapshot?.gracePeriod,
			graceOn: snapshot?.graceOn ?? null,
			hasValidPayload: isSnapshotPayloadUsable(snapshot),
		});

		if (runtime.status === 'grace' && runtime.graceType === 'onboarding') {
			return structuredClone(graceEntitlements);
		}

		if (!runtime.canUsePayloadEntitlements || !isSnapshotPayloadUsable(snapshot)) {
			return normalizeLicenseEntitlements(undefined);
		}

		return normalizeLicenseEntitlements(snapshot?.payload?.metadata.entitlements);
	} catch (error) {
		logger.warn(error, '[license] Failed to load entitlements');
		return normalizeLicenseEntitlements(undefined);
	}
}

export async function getLicenseUsageSummary(
	knex: Knex,
	entitlements: LicenseEntitlements,
): Promise<LicenseUsageSummary> {
	const [collections, userCounts] = await Promise.all([countActiveCollections(knex), fetchUserCount({ knex })]);
	const userSeats = getUserSeatsCount(userCounts);
	const seatLimit = getNumericEntitlementLimit(entitlements.seats);

	return {
		collections: {
			current: collections,
		},
		seats: {
			current: userSeats,
			remaining: seatLimit === null ? null : Math.max(seatLimit - userSeats, 0),
		},
	};
}

export async function countActiveCollections(knex: Knex): Promise<number> {
	const collections = (await knex('directus_collections').select('collection', 'excluded')) as {
		collection: string;
		excluded?: boolean | null;
	}[];

	return collections.filter(({ collection, excluded }) => !isSystemCollection(collection) && !toBoolean(excluded))
		.length;
}
