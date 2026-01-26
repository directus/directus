<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VItemGroup from '@/components/v-item-group.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useDeploymentNavigation } from '../composables/use-deployment-navigation';

const route = useRoute();
const { providers, loading, openProviders, fetch, currentProviderKey, currentProjectId } = useDeploymentNavigation();

const isSettingsPage = computed(() => route.name === 'deployment-provider-settings');

const providerItems = computed(() => {
	return providers.value.map((provider) => {
		const hasProjects = (provider.projects?.length ?? 0) > 0;

		return {
			...provider,
			hasProjects,
			// Redirect to settings if no projects has been selected
			link: hasProjects ? `/deployment/${provider.provider}` : `/deployment/${provider.provider}/settings`,
		};
	});
});

onMounted(async () => {
	await fetch();

	// Auto expand current provider
	if (currentProviderKey.value && !openProviders.value.includes(currentProviderKey.value)) {
		openProviders.value.push(currentProviderKey.value);
	}
});
</script>

<template>
	<VList nav>
		<VListItem to="/deployment" exact>
			<VListItemIcon>
				<VIcon name="rocket_launch" />
			</VListItemIcon>
			<VListItemContent>
				{{ $t('deployment_overview') }}
			</VListItemContent>
		</VListItem>

		<VDivider v-if="providers.length > 0 || loading" />

		<template v-if="loading">
			<VListItem v-for="n in 2" :key="n">
				<VSkeletonLoader type="list-item-icon" />
			</VListItem>
		</template>

		<VItemGroup v-else v-model="openProviders" scope="deployment-navigation" multiple>
			<VListGroup
				v-for="provider in providerItems"
				:key="provider.id"
				clickable
				:to="provider.link"
				:active="
					currentProviderKey === provider.provider && !currentProjectId && (!isSettingsPage || !provider.hasProjects)
				"
				:value="provider.provider"
				scope="deployment-navigation"
				:arrow-placement="provider.hasProjects ? 'after' : false"
			>
				<template #activator>
					<VListItemIcon><VIcon :name="provider.provider" /></VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t(`deployment_provider_${provider.provider}`)" />
					</VListItemContent>
				</template>

				<template v-if="provider.hasProjects">
					<VListItem
						v-for="project in provider.projects"
						:key="project.id"
						:to="`/deployment/${provider.provider}/${project.id}/runs`"
						:active="currentProjectId === project.id"
					>
						<VListItemIcon><VIcon :name="provider.provider" /></VListItemIcon>
						<VListItemContent>
							<VTextOverflow :text="project.name" />
						</VListItemContent>
					</VListItem>

					<VListItem
						:to="`/deployment/${provider.provider}/settings`"
						:active="isSettingsPage && currentProviderKey === provider.provider"
					>
						<VListItemIcon><VIcon name="settings" /></VListItemIcon>
						<VListItemContent>
							<VTextOverflow :text="$t('settings')" />
						</VListItemContent>
					</VListItem>
				</template>
			</VListGroup>
		</VItemGroup>
	</VList>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--theme--background-accent);
}

.v-divider {
	--v-divider-color: var(--theme--background-accent);
}
</style>
