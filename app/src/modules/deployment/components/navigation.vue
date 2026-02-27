<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDeploymentNavigation } from '../composables/use-deployment-navigation';
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
import { usePermissionsStore } from '@/stores/permissions';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const isAdmin = useUserStore().isAdmin;
const canReadRuns = usePermissionsStore().hasPermission('directus_deployment_runs', 'read');
const { providers, loading, openProviders, fetch, currentProviderKey, currentProjectId } = useDeploymentNavigation();

const isSettingsPage = computed(() => route.name === 'deployments-provider-settings');

const providerItems = computed(() => {
	const items = isAdmin ? providers.value : providers.value.filter((p) => (p.projects?.length ?? 0) > 0 && canReadRuns);

	return items.map((provider) => {
		const hasProjects = (provider.projects?.length ?? 0) > 0;
		let link = `/deployments/${provider.provider}`;

		if (!hasProjects && isAdmin) {
			link = `/deployments/${provider.provider}/settings`;
		}

		return {
			...provider,
			hasProjects,
			link,
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
		<VListItem to="/deployments" exact>
			<VListItemIcon>
				<VIcon name="rocket_launch" />
			</VListItemIcon>
			<VListItemContent>
				{{ $t('deployment.overview.overview') }}
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
				:arrow-placement="provider.hasProjects && canReadRuns ? 'after' : false"
			>
				<template #activator>
					<VListItemIcon><VIcon :name="provider.provider" /></VListItemIcon>
					<VListItemContent>
						<VTextOverflow :text="$t(`deployment.provider.${provider.provider}.name`)" />
					</VListItemContent>
				</template>

				<template v-if="provider.hasProjects && canReadRuns">
					<VListItem
						v-for="project in provider.projects"
						:key="project.id"
						:to="`/deployments/${provider.provider}/${project.id}/runs`"
						:active="currentProjectId === project.id"
					>
						<VListItemIcon><VIcon :name="provider.provider" /></VListItemIcon>
						<VListItemContent>
							<VTextOverflow :text="project.name" />
						</VListItemContent>
					</VListItem>

					<VListItem
						v-if="isAdmin"
						:to="`/deployments/${provider.provider}/settings`"
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
</style>
