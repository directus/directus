import { readDeployments } from '@directus/sdk';
import type { DeploymentConfig } from '@directus/types';
import { ref } from 'vue';
import { sdk } from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';

const cache = ref<DeploymentConfig[]>([]);
const loading = ref(false);
const loaded = ref(false);
let fetchPromise: Promise<void> | null = null;
let fetchRequestId = 0;

export function useDeploymentProviders() {
	async function fetch(force = false) {
		if (!force && loaded.value) return;
		if (!force && fetchPromise) return fetchPromise;

		loading.value = true;

		const requestId = ++fetchRequestId;
		fetchPromise = fetchProviders(requestId);

		return fetchPromise;
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

async function fetchProviders(requestId: number) {
	try {
		const data = await sdk.request<DeploymentConfig[]>(
			readDeployments({
				fields: ['provider', 'options', { projects: ['id', 'name'] }],
			}),
		);

		if (requestId !== fetchRequestId) return;

		cache.value = data;
		loaded.value = true;
	} catch (error) {
		if (requestId === fetchRequestId) unexpectedError(error);
	} finally {
		if (requestId === fetchRequestId) {
			fetchPromise = null;
			loading.value = false;
		}
	}
}
