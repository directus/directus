import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useDeploymentProviders } from './use-deployment-providers';

const openProviders = ref<string[]>([]);

export function useDeploymentNavigation() {
	const route = useRoute();
	const providers = useDeploymentProviders();

	const currentProviderKey = computed(() => route.params.provider as string | undefined);
	const currentProjectId = computed(() => route.params.projectId as string | undefined);

	const currentProject = computed(() => {
		if (!currentProviderKey.value || !currentProjectId.value) return null;
		const provider = providers.providers.value.find((p) => p.provider === currentProviderKey.value);
		return provider?.projects?.find((p) => p.id === currentProjectId.value) || null;
	});

	return {
		...providers,
		openProviders,
		currentProviderKey,
		currentProjectId,
		currentProject,
	};
}
