import { type LicenseInfo, readLicense } from '@directus/sdk';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import sdk from '@/sdk';

export type LicenseBoundary = {
	type: 'renewal' | 'expiration';
	timestamp: number;
};

const NUMERIC_ENTITLEMENT_KEYS = [
	'seats',
	'collections',
	'activity_historical_timeframe',
	'revision_historical_timeframe',
] as const;

type NumericEntitlementKey = (typeof NUMERIC_ENTITLEMENT_KEYS)[number];

type EnrichedNumericEntitlement = LicenseInfo['entitlements'][NumericEntitlementKey] & { effective: number };

export type EnrichedLicenseInfo = Omit<LicenseInfo, 'entitlements'> & {
	entitlements: Omit<LicenseInfo['entitlements'], NumericEntitlementKey> & {
		[K in NumericEntitlementKey]: EnrichedNumericEntitlement;
	};
};

function enrichLicense(raw: LicenseInfo): EnrichedLicenseInfo {
	const entitlements = { ...raw.entitlements } as EnrichedLicenseInfo['entitlements'];

	for (const key of NUMERIC_ENTITLEMENT_KEYS) {
		const entitlement = raw.entitlements[key];

		entitlements[key] = {
			...entitlement,
			effective: entitlement.limit + (entitlement.addon ?? 0) + (entitlement.overage ?? 0),
		};
	}

	return { ...raw, entitlements };
}

export const useLicenseStore = defineStore('licenseStore', () => {
	const info = ref<EnrichedLicenseInfo | null>(null);
	const loading = ref(false);
	const error = ref<unknown>(null);

	let refreshTimer: ReturnType<typeof setTimeout> | null = null;

	const boundary = computed<LicenseBoundary | null>(() => {
		if (!info.value) return null;
		if (info.value.renews_at !== undefined) return { type: 'renewal', timestamp: info.value.renews_at };
		if (info.value.expires_at !== undefined) return { type: 'expiration', timestamp: info.value.expires_at };
		return null;
	});

	function clearTimer() {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
			refreshTimer = null;
		}
	}

	function scheduleNextRefresh() {
		clearTimer();

		if (!info.value || !boundary.value) return;

		const now = Math.floor(Date.now() / 1000);

		// For expirations, also schedule a refresh at the end of grace.
		const targets =
			boundary.value.type === 'expiration'
				? [boundary.value.timestamp, boundary.value.timestamp + info.value.grace_period]
				: [boundary.value.timestamp];

		const nextBoundary = targets.find((t) => t > now);
		if (nextBoundary === undefined) return;

		// Cap at 24h to avoid setTimeout precision issues with very long delays.
		const delayMs = Math.min((nextBoundary - now) * 1000 + 1000, 24 * 60 * 60 * 1000);

		refreshTimer = setTimeout(() => {
			void hydrate();
		}, delayMs);
	}

	async function hydrate() {
		loading.value = true;

		try {
			info.value = enrichLicense(await sdk.request(readLicense()));
			error.value = null;
			scheduleNextRefresh();
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function dehydrate() {
		clearTimer();
		info.value = null;
		error.value = null;
		loading.value = false;
	}

	return {
		info,
		loading,
		error,
		boundary,
		hydrate,
		dehydrate,
	};
});
