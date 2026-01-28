<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { PrivateView } from '@/views/private';
import VIcon from '@/components/v-icon/v-icon.vue';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import ProviderSetupDrawer from '../components/provider-setup-drawer.vue';
import DeploymentNavigation from '../components/navigation.vue';
import { useDeploymentNavigation } from '../composables/use-deployment-navigation';
import { availableProviders } from '../config/provider-fields';

const router = useRouter();

const { providers, loading, fetch } = useDeploymentNavigation();

const selectedProvider = ref<string | null>(null);

const setupDrawerActive = computed({
	get: () => selectedProvider.value !== null,
	set: (value) => {
		if (!value) selectedProvider.value = null;
	},
});

const providersList = computed(() => {
	return availableProviders.map((type) => {
		const config = providers.value.find((p) => p.provider === type);
		return {
			type,
			configured: !!config,
			projectsCount: config?.projects?.length,
		};
	});
});

function onProviderClick(provider: (typeof providersList.value)[number]) {
	if (provider.configured) {
		if (provider.projectsCount === 0) {
			router.push(`/deployment/${provider.type}/settings`);
		} else {
			router.push(`/deployment/${provider.type}`);
		}
	} else {
		selectedProvider.value = provider.type;
	}
}

function onSetupComplete() {
	const provider = selectedProvider.value;
	selectedProvider.value = null;
	fetch(true);
	// Navigate to settings to select projects (no projects after initial setup)
	if (provider) router.push(`/deployment/${provider}/settings`);
}
</script>

<template>
	<PrivateView :title="$t('deployment.overview.overview')" icon="rocket_launch">
		<template #headline>{{ $t('deployment.deployment') }}</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<div class="container">
			<VProgressCircular v-if="loading && providers.length === 0" class="spinner" indeterminate />

			<template v-else>
				<InterfacePresentationDivider :title="$t('deployment.overview.providers')" icon="settings" />

				<VList class="providers-list">
					<VListItem
						v-for="provider in providersList"
						:key="provider.type"
						class="provider-list-item"
						grow
						block
						clickable
						@click="onProviderClick(provider)"
					>
						<div class="icon">
							<VIcon :name="provider.type" />
						</div>
						<VListItemContent>
							<div class="name">
								<span v-if="!provider.configured">{{ $t('deployment.overview.configure') }}</span>
								{{ $t(`deployment.provider.${provider.type}.name`) }}
							</div>
							<div class="description">
								{{
									$t(`deployment.overview.provider_description`, {
										provider: $t(`deployment.provider.${provider.type}.name`),
									})
								}}
							</div>
						</VListItemContent>
						<div v-if="provider.configured" class="meta">
							<div class="projects">
								{{ $t('deployment.overview.projects', { count: provider.projectsCount }) }}
								<VIcon small name="folder" />
							</div>
						</div>
					</VListItem>
				</VList>
			</template>
		</div>

		<ProviderSetupDrawer
			v-if="selectedProvider"
			v-model:active="setupDrawerActive"
			:provider="selectedProvider"
			@complete="onSetupComplete"
		/>
	</PrivateView>
</template>

<style scoped lang="scss">
.container {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.spinner {
	margin: 120px auto;
}

:deep(.presentation-divider) {
	margin-block-start: 0;
	margin-block-end: var(--theme--form--row-gap);
}

.provider-list-item {
	--v-list-item-padding: 20px;
}

.icon {
	inline-size: 44px;
	block-size: 44px;
	border-radius: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--theme--primary);
	margin-inline-end: 20px;

	--v-icon-color: var(--foreground-inverted);
}

.name {
	color: var(--theme--foreground-accent);
	font-weight: 600;
	font-size: 15px;
}

.description {
	color: var(--theme--foreground-subdued);
	font-size: 15px;
}

.meta {
	margin-inline-start: 20px;
	color: var(--theme--foreground-subdued);
	text-align: end;
}

.projects,
.configure {
	display: flex;
	align-items: center;
	gap: 8px;
}
</style>
