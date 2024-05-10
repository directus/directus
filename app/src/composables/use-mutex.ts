import { sleep } from "@directus/sdk";

const MutexKey = ['auth_refresh'] as const;

type MutexKey = (typeof MutexKey)[number];

const timeout = 50;
const maxRetries = 10;

export function useMutex(key: MutexKey, expiresMs: number) {
	const internalKey = `directus-mutex-${key}`;
	const useWebLock = !!navigator.locks;

	let retries = 0;

	async function acquireMutex(callback: (lock?: Lock | null) => Promise<any>): Promise<any> {
		if (useWebLock) {
			return navigator.locks.request(internalKey, callback);
		}

		// fall back to localstorage when navigator.locks is not available
		return localStorageLock(callback);
	}

	async function localStorageLock(callback: (lock?: Lock | null) => Promise<any>) {
		do {
			const mutex = localStorage.getItem(internalKey);

			if (!mutex || Number(mutex) > Date.now() + expiresMs) {
				// set lock
				localStorage.setItem(internalKey, String(Date.now() + expiresMs));

				// do logic
				await callback(null);

				// release lock
				localStorage.removeItem(internalKey);

				break;
			}

			await sleep(timeout);
			retries += 1;
		} while (retries < maxRetries);
		// throw error when hitting max retries?
	}

	return {
		acquireMutex,
	};
}
