import { sleep } from '@directus/sdk';

const MutexKey = ['auth_refresh'] as const;

type MutexKey = (typeof MutexKey)[number];

export function useLocalStorageMutex(key: MutexKey, expiresMs: number) {
	const internalKey = `directus-mutex-${key}`;
	const useWebLock = window.isSecureContext;

	async function acquireMutex() {
		let releaseMutex: (() => void) | undefined;

		if (useWebLock) {
			await new Promise<void>((resolve) => {
				navigator.locks.request(internalKey, { ifAvailable: true }, async function (granted) {
					await new Promise<void>((lockResolve) => {
						if (granted) {
							releaseMutex = lockResolve;
							resolve();
						} else {
							lockResolve();
							resolve();
						}
					});
				});
			});
		} else {
			// Random wait to prevent concurrent refreshes across browser windows/tabs
			await sleep(Math.random() * 1000);

			const mutex = localStorage.getItem(internalKey);

			if (!mutex || Number(mutex) > Date.now() + expiresMs) {
				localStorage.setItem(internalKey, String(Date.now() + expiresMs));

				releaseMutex = releaseLocalStorageMutex;
			}
		}

		return releaseMutex;
	}

	function releaseLocalStorageMutex() {
		localStorage.removeItem(internalKey);
	}

	return {
		acquireMutex,
	};
}
