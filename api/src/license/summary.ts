import { isSystemCollection } from '@directus/system-data';
import type { Knex } from 'knex';
import { useLogger } from '../logger/index.js';
import { fetchUserCount, getUserSeatsCount } from '../utils/fetch-user-count/fetch-user-count.js';
import { getCurrentLicenseBinding } from './binding.js';
import { graceEntitlements } from './defaults.js';
import { getPayloadDisplayMetadata, getStoredLicenseDisplayMetadata } from './display-metadata.js';
import { normalizeLicenseEntitlements } from './entitlements.js';
import { getLocalLicensePayload } from './get-license-payload.js';
import { isOnboardingGraceActive } from './license-status.js';
import { getRuntimeState } from './runtime.js';
import type {
	DerivedLicenseStatus,
	LicenseDisplayMetadata,
	LicenseEntitlements,
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
	const binding = await getCurrentLicenseBinding(knex);

	let payload = null;

	try {
		payload = (await getLocalLicensePayload(knex)) ?? null;
	} catch (error) {
		logger.warn(error, '[license] Failed to resolve stored license payload');
	}

	let displayMetadata = getPayloadDisplayMetadata(payload);

	if (!displayMetadata && binding.terminal !== null) {
		displayMetadata = (await getStoredLicenseDisplayMetadata(knex)) ?? null;
	}

	const runtime = getRuntimeState({
		terminal: binding.terminal,
		durableStatus: binding.durableStatus,
		payloadStatus: payload?.metadata.status,
		tokenExpiresAt: payload?.exp,
		gracePeriod: payload?.metadata.grace_period,
		graceOn: binding.graceOn,
		hasValidPayload: payload !== null,
		isFallbackCompliant:
			payload === null &&
			binding.terminal === null &&
			(binding.durableStatus === 'active' || binding.durableStatus === 'deactivated') &&
			!isOnboardingGraceActive(binding.graceOn)
				? true
				: undefined,
	});

	return {
		source: binding.source,
		showLicenseKeyField: binding.source !== 'env',
		displayMetadata,
		displayStatus: binding.terminal ?? displayMetadata?.status ?? null,
		status: runtime.status,
		locked: runtime.locked,
		graceType: runtime.graceType,
	};
}

export async function getLicenseEntitlements(knex?: Knex): Promise<LicenseEntitlements> {
	try {
		const payload = (await getLocalLicensePayload(knex)) ?? null;
		const binding = await getCurrentLicenseBinding(knex);

		const runtime = getRuntimeState({
			terminal: binding.terminal,
			durableStatus: binding.durableStatus,
			payloadStatus: payload?.metadata.status,
			tokenExpiresAt: payload?.exp,
			gracePeriod: payload?.metadata.grace_period,
			graceOn: binding.graceOn,
			hasValidPayload: payload !== null,
		});

		if (runtime.status === 'grace' && runtime.graceType === 'onboarding') {
			return structuredClone(graceEntitlements);
		}

		if (!runtime.canUsePayloadEntitlements || !payload) {
			return normalizeLicenseEntitlements(undefined);
		}

		return normalizeLicenseEntitlements(payload.metadata.entitlements);
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
	const seatLimit = getSeatLimit(entitlements);

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

function getSeatLimit(entitlements: LicenseEntitlements): number | null {
	if (entitlements.seats.hard_limit !== undefined && entitlements.seats.hard_limit !== null) {
		return entitlements.seats.hard_limit;
	}

	if (entitlements.seats.limit === null) {
		return null;
	}

	if (entitlements.seats.is_overage_allowed === true) {
		return null;
	}

	return entitlements.seats.limit;
}

async function countActiveCollections(knex: Knex): Promise<number> {
	const collections = await knex('directus_collections').select('collection');
	return collections.filter(({ collection }) => !isSystemCollection(collection)).length;
}
