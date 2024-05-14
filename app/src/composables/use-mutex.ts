import { sleep } from '@/utils/sleep';

const TIMEOUT = 500;
const MAX_RETRIES = 60;

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
				await sleep(Math.random() * TIMEOUT);

				const mutex = localStorage.getItem(internalKey);

				if (!mutex || Number(mutex) < Date.now()) {
					localStorage.setItem(internalKey, String(Date.now() + expiresMs));
					hasAcquiredMutex = true;

					await callback(null);

					break;
				}

				retries += 1;
			} while (retries < MAX_RETRIES);

			if (!hasAcquiredMutex) {
				throw new Error('Failed to acquire mutex');
			}
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
