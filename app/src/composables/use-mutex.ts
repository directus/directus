import { sleep } from '@directus/sdk';

const MutexKey = ['auth_refresh'] as const;

type MutexKey = (typeof MutexKey)[number];

export function useLocalStorageMutex(key: MutexKey) {
	async function isMutexAvailable() {
		// Random wait to prevent concurrent refreshes across browser windows/tabs
		await sleep(Math.random() * 500);
		return !localStorage.getItem(key);
	}

	function acquireMutex() {
		localStorage.setItem(key, 'locked');
	}

	function releaseMutex() {
		localStorage.removeItem(key);
	}

	return {
		isMutexAvailable,
		acquireMutex,
		releaseMutex,
	};
}
