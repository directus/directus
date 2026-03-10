import { readDeployments } from '@directus/sdk';
import type { DeploymentConfig } from '@directus/types';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { sdk } from '@/sdk';
import { unexpectedError } from '@/utils/unexpected-error';

const cache = ref<DeploymentConfig[]>([]);
const loading = ref(false);
const openProviders = ref<string[]>([]);

export function useDeploymentNavigation() {
	const route = useRoute();

	async function fetch(force = false) {
		if (!force && cache.value.length > 0) return;

		loading.value = true;

		try {
			const data = await sdk.request<DeploymentConfig[]>(
				readDeployments({
					fields: ['provider', { projects: ['id', 'name'] }],
				}),
			);

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

	const currentProviderKey = computed(() => route.params.provider as string | undefined);
	const currentProjectId = computed(() => route.params.projectId as string | undefined);

	const currentProject = computed(() => {
		if (!currentProviderKey.value || !currentProjectId.value) return null;
		const provider = cache.value.find((p) => p.provider === currentProviderKey.value);
		return provider?.projects?.find((p) => p.id === currentProjectId.value) || null;
	});

	return {
		providers: cache,
		loading,
		openProviders,
		fetch,
		refresh,
		currentProviderKey,
		currentProjectId,
		currentProject,
	};
}
