import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { LicenseAddon, LicenseInfo } from '@/license/types';
import sdk, { requestEndpoint } from '@/sdk';

export type LicenseBoundary = {
	type: 'renewal' | 'expiration';
	timestamp: number;
};

export const useLicenseStore = defineStore('licenseStore', () => {
	const info = ref<LicenseInfo | null>(null);
	const addons = ref<LicenseAddon[] | null>(null);
	const loading = ref(false);
	const loadingAddons = ref(false);
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
		const effective = seats.limit + (seats.addon ?? 0) + (seats.overage ?? 0);
		return effective - (info.value.usage?.seats ?? 0);
	});

	const hasRemainingSeats = computed(() => seatsRemaining.value === null || seatsRemaining.value > 0);

	const isLocked = computed(() => {
		const status = info.value?.status;
		return status === 'expired' || status === 'suspended' || status === 'canceled';
	});

<<<<<<< HEAD
	const customLLMEnabled = computed(() => info.value?.entitlements?.custom_llms_enabled?.default === true);

	const customPermissionRulesEnabled = computed(
		() => info.value?.entitlements?.custom_permission_rules_enabled?.default === true,
	);

=======
>>>>>>> parent of fa5c49fc83 (feat: implement customLLM screen)
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
			info.value = await sdk.request(requestEndpoint<LicenseInfo>('/license', { method: 'GET' }));
			error.value = null;
			scheduleNextRefresh();
		} catch (err) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function hydrateAddons() {
		loadingAddons.value = true;

		try {
			addons.value = await sdk.request(requestEndpoint<LicenseAddon[]>('/license/addons', { method: 'GET' }));
		} finally {
			loadingAddons.value = false;
		}
	}

	async function dehydrate() {
		clearTimer();
		info.value = null;
		addons.value = null;
		error.value = null;
		loading.value = false;
		loadingAddons.value = false;
	}

	return {
		info,
		addons,
		loading,
		loadingAddons,
		error,
		boundary,
		seatsRemaining,
		hasRemainingSeats,
		isLocked,
		customPermissionRulesEnabled,
		hydrate,
		hydrateAddons,
		dehydrate,
	};
});
