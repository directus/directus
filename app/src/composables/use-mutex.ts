import { sleep } from '@/utils/sleep';

const timeout = 500;
const maxRetries = 10;

export function useMutex(key: string, expiresMs: number) {
	const internalKey = `directus-mutex-${key}`;
	const useWebLock = !!navigator.locks;

	async function acquireMutex(callback: (lock?: Lock | null) => Promise<any>): Promise<any> {
		if (useWebLock) {
			return navigator.locks.request(internalKey, callback);
		}

		// fall back to localstorage when navigator.locks is not available
		return localStorageLock(callback);
	}

	async function localStorageLock(callback: (lock?: Lock | null) => Promise<any>) {
		let retries = 0;
		let hasAcquiredMutex = false;

		try {
			do {
				// attempt to prevent concurrent mutex acquiring across browser windows/tabs
				await sleep(Math.random() * timeout);

				const mutex = localStorage.getItem(internalKey);

				if (!mutex || Number(mutex) > Date.now() + expiresMs) {
					// set lock
					localStorage.setItem(internalKey, String(Date.now() + expiresMs));
					hasAcquiredMutex = true;

					// do logic
					await callback(null);

					break;
				}

				retries += 1;
			} while (retries < maxRetries);
			// throw error when hitting max retries?
		} finally {
			if (hasAcquiredMutex) {
				// release lock
				localStorage.removeItem(internalKey);
			}
		}
	}

	return {
		acquireMutex,
	};
}
