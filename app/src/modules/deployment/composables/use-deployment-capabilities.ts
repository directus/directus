import type { DeploymentProviderCapabilities } from '@directus/types';
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue';
import { resolveDeploymentCapabilities } from '../config/providers';

export function useDeploymentCapabilities(provider: MaybeRefOrGetter<string>) {
	const capabilitiesFromApi = ref<DeploymentProviderCapabilities | null>(null);

	const capabilities = computed(() => resolveDeploymentCapabilities(toValue(provider), capabilitiesFromApi.value));

	function setFromDeployment(deployment: { capabilities?: DeploymentProviderCapabilities | null } | null | undefined) {
		capabilitiesFromApi.value = deployment?.capabilities ?? null;
	}

	function reset() {
		capabilitiesFromApi.value = null;
	}

	return { capabilities, setFromDeployment, reset };
}
