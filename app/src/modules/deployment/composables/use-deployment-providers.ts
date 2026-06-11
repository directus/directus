import { readDeployments } from '@directus/sdk';
import type { DeploymentConfig } from '@directus/types';
import { ref } from 'vue';
import { sdk } from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';

const cache = ref<DeploymentConfig[]>([]);
const loading = ref(false);
const loaded = ref(false);
let fetchPromise: Promise<void> | null = null;

export function useDeploymentProviders() {
	async function fetch(force = false) {
		if (!force && loaded.value) return;
		if (!force && fetchPromise) return fetchPromise;

		loading.value = true;

		const pending = (async () => {
			try {
				const data = await sdk.request<DeploymentConfig[]>(
					readDeployments({
						fields: ['provider', 'options', { projects: ['id', 'name'] }],
					}),
				);

				cache.value = data;
				loaded.value = true;
			} catch (error) {
				unexpectedError(error);
			}
		})();

		fetchPromise = pending;

		try {
			await pending;
		} finally {
			if (fetchPromise === pending) {
				fetchPromise = null;
				loading.value = false;
			}
		}
	}

	function refresh() {
		loaded.value = false;
		return fetch(true);
	}

	return {
		providers: cache,
		loading,
		loaded,
		fetch,
		refresh,
	};
}
