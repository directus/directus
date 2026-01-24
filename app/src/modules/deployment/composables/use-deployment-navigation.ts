import { ref } from 'vue';
import { sdk } from '@/sdk';
import { readDeployments } from '@directus/sdk';
import { unexpectedError } from '@/utils/unexpected-error';
import type { DeploymentConfig } from '@directus/types';

const cache = ref<DeploymentConfig[]>([]);
const loading = ref(false);
const openProviders = ref<string[]>([]);

export function useDeploymentNavigation() {
	async function fetch(force = false) {
		if (!force && cache.value.length > 0) return;

		loading.value = true;

		try {
			const data = await sdk.request<DeploymentConfig[]>(readDeployments({
				fields: ['provider', { projects: ['id', 'name'] }],
			}));

			cache.value = data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	function refresh() {
		return fetch(true);
	}

	return {
		providers: cache,
		loading,
		openProviders,
		fetch,
		refresh,
	};
}
