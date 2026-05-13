import {
	applyLicenseResolution,
	type ApplyLicenseResolutionInput,
	generateLicensePendingResolution,
	type LicenseAddon,
	type LicensePendingResolution,
	type LicensePendingResolutionInput,
	readLicense,
	readLicenseAddons,
	type ReadLicenseOutput,
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

export const useLicenseStore = defineStore('licenseStore', () => {
	const info = ref<ReadLicenseOutput | null>(null);
	const addons = ref<LicenseAddon[] | null>(null);
	const pendingResolution = ref<LicensePendingResolution[] | null>(null);
	const loading = ref(false);
	const loadingAddons = ref(false);
	const loadingPendingResolution = ref(false);
	const error = ref<unknown>(null);

	let refreshTimer: ReturnType<typeof setTimeout> | null = null;

	const boundary = computed<LicenseBoundary | null>(() => {
		if (!info.value) return null;
		if (info.value.renews_at !== undefined) return { type: 'renewal', timestamp: info.value.renews_at };
		if (info.value.expires_at !== undefined) return { type: 'expiration', timestamp: info.value.expires_at };
		return null;
	});

	const seatsRemaining = computed<number | null>(() => {
		if (!info.value) return null;
		const seats = info.value.entitlements.seats;
		const usage = info.value.usage;
		const effective = seats.limit + (seats.addon ?? 0) + (seats.overage ?? 0);
		return effective - (usage?.seats ?? 0);
	});

	const hasRemainingSeats = computed(() => seatsRemaining.value === null || seatsRemaining.value > 0);

	const collectionsRemaining = computed<number | null>(() => {
		if (!info.value) return null;
		const col = info.value.entitlements.collections;
		if (!col) return null;
		if (col.limit == null) return null;
		const effective = col.limit + (col.addon ?? 0) + (col.overage ?? 0);
		return effective - (info.value.usage?.collections ?? 0);
	});

	const hasRemainingCollections = computed(() => collectionsRemaining.value === null || collectionsRemaining.value > 0);

	const flowsRemaining = computed<number | null>(() => {
		if (!info.value) return null;
		const fl = info.value.entitlements.flows;
		if (!fl) return null;
		if (fl.limit == null) return null;
		const effective = fl.limit + (fl.addon ?? 0) + (fl.overage ?? 0);
		return effective - (info.value.usage?.flows ?? 0);
	});

	const hasRemainingFlows = computed(() => flowsRemaining.value === null || flowsRemaining.value > 0);

	const isLocked = computed(() => {
		const status = info.value?.status;
		return status === 'expired' || status === 'suspended' || status === 'canceled' || status === 'locked';
	});

	const customPermissionRulesEnabled = computed(() => {
		const ent = info.value?.entitlements?.custom_permission_rules_enabled;
		if (!ent) return false;
		return ent.override ?? ent.default;
	});

	const customLLMEnabled = computed(() => {
		const ent = info.value?.entitlements?.custom_llms_enabled;
		if (!ent) return false;
		return ent.override ?? ent.default;
	});

	const isLicensed = computed(() => {
		const status = info.value?.status;
		return status === 'active' || status === 'grace';
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
		boundary,
		seatsRemaining,
		hasRemainingSeats,
		collectionsRemaining,
		hasRemainingCollections,
		flowsRemaining,
		hasRemainingFlows,
		isLocked,
		customPermissionRulesEnabled,
		isLicensed,
		needsResolution,
		customLLMEnabled,
		revisionHistoryTimeframe,
		activityHistoryTimeframe,
		hydrate,
		hydrateAddons,
		hydratePendingResolution,
		resolve,
		dehydrate,
	};
});
