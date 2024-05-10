import { sleep } from '@directus/sdk';

const MutexKey = ['auth_refresh'] as const;

type MutexKey = (typeof MutexKey)[number];

export function useLocalStorageMutex(key: MutexKey, expiresMs: number) {
	const internalKey = `directus-mutex-${key}`;

	async function isMutexAvailable() {
		// Random wait to prevent concurrent refreshes across browser windows/tabs
		await sleep(Math.random() * 1000);

		const mutex = localStorage.getItem(internalKey);

		if (!mutex) {
			return true;
		} else if (Number(mutex) > Date.now() + expiresMs) {
			return true;
		}

		return false;
	}

	function acquireMutex() {
		localStorage.setItem(internalKey, String(Date.now() + expiresMs));
	}

	function releaseMutex() {
		localStorage.removeItem(internalKey);
	}

	return {
		isMutexAvailable,
		acquireMutex,
		releaseMutex,
	};
}
