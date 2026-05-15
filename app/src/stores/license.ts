import {
	activateLicense,
	applyLicenseResolution,
	type ApplyLicenseResolutionInput,
	type CountableEntitlementKey,
	generateLicensePendingResolution,
	type LicenseAddon,
	type LicensePendingResolution,
	type LicensePendingResolutionInput,
	readLicense,
	readLicenseAddons,
	type ReadLicenseOutput,
	updateLicense,
} from '@directus/license';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import sdk from '@/sdk';
import { useUserStore } from '@/stores/user';
import { formatTimeframe } from '@/utils/format-timeframe';

export type LicenseBoundary = {
	type: 'renewal' | 'expiration';
	timestamp: number;
};

type LicenseLimit = {
	remaining: number | null;
	hasRemaining: boolean;
};

export const useLicenseStore = defineStore('licenseStore', () => {
	const info = ref<ReadLicenseOutput | null>(null);
	const addons = ref<LicenseAddon[] | null>(null);
	const pendingResolution = ref<LicensePendingResolution[] | null>(null);
	const loading = ref(false);
	const loadingAddons = ref(false);
	const loadingPendingResolution = ref(false);
	const error = ref<unknown>(null);

	let refreshTimer: ReturnType<typeof setTimeout> | null = null;

	const aiTranslationsEnabled = computed(() => isEntitlementEnabled('ai_translations_enabled'));

	const boundary = computed<LicenseBoundary | null>(() => {
		if (!info.value) return null;
		if (info.value.renews_at !== undefined) return { type: 'renewal', timestamp: info.value.renews_at };
		if (info.value.expires_at !== undefined) return { type: 'expiration', timestamp: info.value.expires_at };
		return null;
	});

	function getLimit(key: CountableEntitlementKey): LicenseLimit {
		if (!info.value) return { remaining: null, hasRemaining: loading.value };
		const ent = info.value.entitlements[key];
		if (!ent || ent.limit == null) return { remaining: null, hasRemaining: false };

		if (ent.limit === -1 || ent.overage === -1 || ent.addon === -1) return { remaining: null, hasRemaining: true };

		const effective = ent.limit + (ent.addon ?? 0) + (ent.overage ?? 0);
		const remaining = effective - (info.value.usage?.[key] ?? 0);

		return { remaining, hasRemaining: remaining > 0 };
	}

	const limits = computed<Record<CountableEntitlementKey, LicenseLimit>>(() => ({
		seats: getLimit('seats'),
		collections: getLimit('collections'),
		flows: getLimit('flows'),
	}));

	const isLocked = computed(() => {
		const status = info.value?.status;
		return status === 'expired' || status === 'suspended' || status === 'canceled' || status === 'locked';
	});

	const customPermissionRulesEnabled = computed(() => isEntitlementEnabled('custom_permission_rules_enabled'));

	const customLLMEnabled = computed(() => isEntitlementEnabled('custom_llms_enabled'));

	const isLicensed = computed(() => {
		if (!info.value || info.value.source === null) return false;
		return info.value.status === 'active' || info.value.status === 'grace';
	});

	const needsResolution = computed(() => {
		const status = info.value?.status;
		return status === 'expired' || status === 'suspended' || status === 'canceled' || status === 'locked';
	});

	const revisionHistoryTimeframe = computed(() => {
		const limit = info.value?.entitlements?.revision_historical_timeframe?.limit;
		return limit ? formatTimeframe(limit) : null;
	});

	const activityHistoryTimeframe = computed(() => {
		const limit = info.value?.entitlements?.activity_historical_timeframe?.limit;
		return limit ? formatTimeframe(limit) : null;
	});

	const graceDays = computed<number | null>(() => {
		if (!info.value || info.value.status !== 'grace' || !info.value.expires_at) return null;
		const deadlineMs = (info.value.expires_at + (info.value.grace_period ?? 0)) * 1000;
		return Math.max(0, Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24)));
	});

	function isEntitlementEnabled(key: string) {
		const ent = info.value?.entitlements[key];
		if (!ent) return false;
		return ent.override ?? ent.default;
	}

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
		// License endpoints are admin-only — skip silently for non-admin users.
		if (!useUserStore().isAdmin) return;

		loading.value = true;

		try {
			info.value = await sdk.request(readLicense());
			error.value = null;
			scheduleNextRefresh();
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function hydrateAddons() {
		if (!useUserStore().isAdmin) return;

		loadingAddons.value = true;

		try {
			addons.value = await sdk.request(readLicenseAddons());
		} finally {
			loadingAddons.value = false;
		}
	}

	async function hydratePendingResolution(opts: LicensePendingResolutionInput = {}) {
		if (!useUserStore().isAdmin) return;

		loadingPendingResolution.value = true;

		try {
			const result: LicensePendingResolution[] | void = await sdk.request(generateLicensePendingResolution(opts));
			pendingResolution.value = result ?? [];
		} finally {
			loadingPendingResolution.value = false;
		}
	}

	async function resolve(payload: ApplyLicenseResolutionInput) {
		await sdk.request(applyLicenseResolution(payload));
		pendingResolution.value = null;
		await hydrate();
	}

	async function activate(licenseKey: string) {
		await sdk.request(activateLicense({ license_key: licenseKey }));
		await hydrate();
	}

	async function update(licenseKey: string) {
		await sdk.request(updateLicense({ license_key: licenseKey }));
		await hydrate();
	}

	async function dehydrate() {
		clearTimer();
		info.value = null;
		addons.value = null;
		pendingResolution.value = null;
		error.value = null;
		loading.value = false;
		loadingAddons.value = false;
		loadingPendingResolution.value = false;
	}

	return {
		info,
		addons,
		pendingResolution,
		loading,
		loadingAddons,
		loadingPendingResolution,
		error,
		aiTranslationsEnabled,
		boundary,
		limits,
		isLocked,
		customPermissionRulesEnabled,
		isLicensed,
		needsResolution,
		customLLMEnabled,
		revisionHistoryTimeframe,
		activityHistoryTimeframe,
		graceDays,
		hydrate,
		hydrateAddons,
		hydratePendingResolution,
		resolve,
		activate,
		update,
		dehydrate,
	};
});
