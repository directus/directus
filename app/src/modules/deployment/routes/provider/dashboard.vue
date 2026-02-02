<script setup lang="ts">
import { type DeploymentDashboardOutput, readDeploymentDashboard } from '@directus/sdk';
import { formatDistanceToNow } from 'date-fns';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DeploymentStatus from '../../components/deployment-status.vue';
import DeploymentNavigation from '../../components/navigation.vue';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import InterfacePresentationDivider from '@/interfaces/presentation-divider/presentation-divider.vue';
import { sdk } from '@/sdk';
import { PrivateView } from '@/views/private';

type Project = DeploymentDashboardOutput['projects'][number];

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();

const loading = ref(true);
const projects = ref<Project[]>([]);

const projectItems = computed(() =>
	projects.value.map((project) => ({
		...project,
		to: `/deployment/${props.provider}/${project.id}/runs`,
		formattedDeployTime: project.latest_deployment?.created_at
			? formatDistanceToNow(new Date(project.latest_deployment.created_at), { addSuffix: true })
			: '',
	})),
);

onMounted(async () => {
	try {
		const data = await sdk.request(readDeploymentDashboard(props.provider));
		projects.value = data.projects;
	} catch {
		projects.value = [];
	} finally {
		loading.value = false;
	}
});
</script>

<template>
	<PrivateView :title="$t(`deployment.provider.${provider}.name`)" :icon="provider">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('deployment.deployment'), to: '/deployment' }]" />
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<div class="container">
			<VProgressCircular v-if="loading" class="spinner" indeterminate />

			<VInfo v-else-if="projects.length === 0" icon="folder_off" :title="$t('deployment.no_projects')" center>
				{{ $t('deployment.no_projects_copy') }}
			</VInfo>

			<template v-else>
				<InterfacePresentationDivider
					:title="$t('deployment.dashboard.projects', { count: projects.length })"
					icon="folder"
				/>

				<VList class="projects-list">
					<VListItem
						v-for="project in projectItems"
						:key="project.id"
						class="project-list-item"
						grow
						block
						clickable
						@click="router.push(project.to)"
					>
						<div class="icon">
							<VIcon name="deployed_code" />
						</div>
						<VListItemContent>
							<div class="name">
								{{ project.name }}
								<DeploymentStatus v-if="project.latest_deployment?.status" :status="project.latest_deployment.status" />
							</div>
							<a v-if="project.url" :href="project.url" target="_blank" class="url" @click.stop>
								{{ project.url }}
							</a>
						</VListItemContent>
						<div class="meta">
							<div v-if="project.formattedDeployTime" class="deploy-time">
								{{ $t('deployment.dashboard.deployed') }} {{ project.formattedDeployTime }}
								<VIcon small name="schedule" />
							</div>
						</div>
					</VListItem>
				</VList>
			</template>
		</div>
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

.projects-list {
	--v-list-padding: 0;
}

.project-list-item {
	display: flex;
	align-items: center;
	gap: 16px;
	block-size: 98px !important;
	padding: 0 20px !important;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	margin-block-end: 8px;

	@media (max-width: 768px) {
		flex-wrap: wrap;
		block-size: auto !important;
		padding: 16px 20px !important;
	}

	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 44px;
		block-size: 44px;
		border-radius: 24px;
		background-color: var(--theme--primary);
		flex-shrink: 0;

		--v-icon-color: var(--foreground-inverted);
	}

	.name {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}

	.url {
		flex: 0 0 auto;
		color: var(--theme--primary);
		text-decoration: none;
		font-size: 14px;

		&:hover {
			text-decoration: underline;
		}
	}

	.meta {
		margin-inline-start: auto;
		flex-shrink: 0;

		@media (max-width: 768px) {
			inline-size: 100%;
			margin-inline-start: 0;
			padding-inline-start: 60px; // icon width + gap
			margin-block-start: 4px;
		}
	}

	.deploy-time {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--theme--foreground-subdued);
		font-size: 14px;
	}
}
</style>
