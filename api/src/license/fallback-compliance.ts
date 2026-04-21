import { isSystemCollection } from '@directus/system-data';
import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import { isExternalAuthDriver } from '../auth/constants/sso.js';
import { fetchUserCount, getUserSeatsCount } from '../utils/fetch-user-count/fetch-user-count.js';
import { getAuthProviders } from '../utils/get-auth-providers.js';
import { getLicenseFallbackEntitlements } from './fallback.js';
import { getNumericEntitlementLimit } from './numeric-gate.js';

export type FallbackComplianceResult = {
	compliant: boolean;
	collections: boolean;
	seats: boolean;
	sso: boolean;
};

export async function getProjectFallbackCompliance(knex: Knex): Promise<FallbackComplianceResult> {
	const fallbackEntitlements = getLicenseFallbackEntitlements();

	const [collectionsCurrent, userCounts, externalAuthSafe] = await Promise.all([
		countActiveCollections(knex),
		fetchUserCount({ knex }),
		isExternalAuthSafeForFallback(knex, fallbackEntitlements.sso_enabled),
	]);

	const seatsCurrent = getUserSeatsCount(userCounts);
	const collectionsLimit = getNumericEntitlementLimit(fallbackEntitlements.collections);
	const seatsLimit = getNumericEntitlementLimit(fallbackEntitlements.seats);
	const collections = collectionsLimit === null ? true : collectionsCurrent <= collectionsLimit;
	const seats = seatsLimit === null ? true : seatsCurrent <= seatsLimit;
	const sso = externalAuthSafe;

	return {
		compliant: collections && seats && sso,
		collections,
		seats,
		sso,
	};
}

export async function isExternalAuthSafeForFallback(knex: Knex, ssoEnabled: boolean): Promise<boolean> {
	if (ssoEnabled === true) {
		return true;
	}

	const [settings, externalAuthUserCount] = await Promise.all([
		knex.select('sso_disabled').from('directus_settings').first(),
		countExternalAuthUsers(knex),
	]);

	if (toBoolean(settings?.['sso_disabled'])) {
		return true;
	}

	return hasExternalAuthRuntimeDependencies() === false && externalAuthUserCount === 0;
}

export function hasExternalAuthRuntimeDependencies(): boolean {
	return getExternalAuthProviderNames().length > 0;
}

export function getExternalAuthProviderNames(): string[] {
	return getAuthProviders()
		.filter((provider) => isExternalAuthDriver(provider.driver))
		.map((provider) => provider.name);
}

async function countExternalAuthUsers(knex: Knex): Promise<number> {
	const externalAuthProviderNames = getExternalAuthProviderNames();

	if (externalAuthProviderNames.length === 0) {
		return 0;
	}

	const result = await knex('directus_users')
		.whereIn('provider', externalAuthProviderNames)
		.count<{ count: string }[]>('* as count');

	return Number(result[0]?.count ?? 0);
}

async function countActiveCollections(knex: Knex): Promise<number> {
	const collections = (await knex('directus_collections').select('collection', 'excluded')) as {
		collection: string;
		excluded?: boolean | null;
	}[];

	return collections.filter(({ collection, excluded }) => !isSystemCollection(collection) && !toBoolean(excluded))
		.length;
}
