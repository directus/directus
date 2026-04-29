import {
	type LicenseAddon,
	type LicenseInfo,
	type LicenseMockQuery,
	readLicense,
	readLicenseAddons,
} from '@directus/sdk';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import sdk from '@/sdk';

export type LicenseBoundary = {
	type: 'renewal' | 'expiration';
	timestamp: number;
};

export const useLicenseStore = defineStore('licenseStore', () => {
	const info = ref<LicenseInfo | null>(null);
	const addons = ref<LicenseAddon[]>([]);
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

	async function hydrate(query?: LicenseMockQuery) {
		loading.value = true;

		try {
			[info.value, addons.value] = await Promise.all([
				sdk.request(readLicense(query)),
				sdk.request(readLicenseAddons()),
			]);

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
		addons.value = [];
		error.value = null;
		loading.value = false;
	}

	return {
		info,
		addons,
		loading,
		error,
		boundary,
		hydrate,
		dehydrate,
	};
});
