import { sleep } from '@directus/sdk';

const MutexKey = ['auth_refresh'] as const;

type MutexKey = (typeof MutexKey)[number];

export function useLocalStorageMutex(key: MutexKey, expiresMs: number) {
	async function isMutexAvailable() {
		// Random wait to prevent concurrent refreshes across browser windows/tabs
		await sleep(Math.random() * 500);

		const mutex = localStorage.getItem(key);

		if (!mutex) {
			return true;
		} else if (Number(mutex) > Date.now() + expiresMs) {
			return true;
		}

		return false;
	}

	function acquireMutex() {
		localStorage.setItem(key, String(Date.now() + expiresMs));
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
