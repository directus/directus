<script setup lang="ts">
import { type DeploymentDashboardOutput, readDeploymentDashboard } from '@directus/sdk';
import { formatDistanceToNow } from 'date-fns';
import { computed, onMounted, ref, watch } from 'vue';
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
type Stats = DeploymentDashboardOutput['stats'];

const props = defineProps<{
	provider: string;
}>();

const router = useRouter();

const loading = ref(true);
const projects = ref<Project[]>([]);
const stats = ref<Stats>({ active_deployments: 0, successful_builds: 0, failed_builds: 0 });

const projectItems = computed(() =>
	projects.value.map((project) => ({
		...project,
		to: `/deployments/${props.provider}/${project.id}/runs`,
		formattedDeployTime: project.latest_deployment?.created_at
			? formatDistanceToNow(new Date(project.latest_deployment.created_at), { addSuffix: true })
			: '',
	})),
);

async function loadDashboard() {
	loading.value = true;

	try {
		const data = await sdk.request(readDeploymentDashboard(props.provider));
		projects.value = data.projects;
		stats.value = data.stats;
	} catch {
		projects.value = [];
		stats.value = { active_deployments: 0, successful_builds: 0, failed_builds: 0 };
	} finally {
		loading.value = false;
	}
}

onMounted(loadDashboard);

watch(() => props.provider, loadDashboard);
</script>

<template>
	<PrivateView :title="$t(`deployment.provider.${provider}.name`)" :icon="provider">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t('deployment.deployment'), to: '/deployments' }]" />
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<VProgressCircular v-if="loading" class="spinner" indeterminate />

		<div v-else class="container">
			<VInfo v-if="projects.length === 0" icon="folder_off" :title="$t('deployment.no_projects')" center>
				{{ $t('deployment.no_projects_copy') }}
			</VInfo>

			<template v-else>
				<div class="stats-bar">
					<div class="stat-card">
						<VIcon name="folder" class="stat-icon" />
						<span>{{ $t('deployment.dashboard.total_projects', { count: projects.length }, projects.length) }}</span>
					</div>

					<div class="stat-card warning">
						<VIcon name="autorenew" class="stat-icon" />
						<span>{{ $t('deployment.dashboard.active_deployments', { count: stats.active_deployments }, stats.active_deployments) }}</span>
					</div>

					<div class="stat-card danger">
						<VIcon name="error" class="stat-icon" />
						<span>{{ $t('deployment.dashboard.failed_builds', { count: stats.failed_builds }, stats.failed_builds) }}</span>
					</div>

					<div class="stat-card success">
						<VIcon name="check" class="stat-icon" />
						<span>{{ $t('deployment.dashboard.successful_builds', { count: stats.successful_builds }, stats.successful_builds) }}</span>
					</div>
				</div>

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
							<div class="name-wrapper">
								<span class="name">{{ project.name }}</span>
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

.stats-bar {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	margin-block-end: 24px;

	@media (max-width: 1512px) {
		grid-template-columns: repeat(3, 1fr);
	}

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 10px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	overflow: hidden;

	&.warning {
		background-color: var(--warning-10);
		color: var(--theme--warning);

		.stat-icon {
			--v-icon-color: var(--theme--warning);
		}
	}

	&.danger {
		background-color: var(--danger-10);
		color: var(--theme--danger);

		.stat-icon {
			--v-icon-color: var(--theme--danger);
		}
	}

	&.success {
		background-color: var(--success-10);
		color: var(--theme--success);

		.stat-icon {
			--v-icon-color: var(--theme--success);
		}
	}
}

.stat-icon {
	--v-icon-color: var(--theme--foreground-subdued);
	flex-shrink: 0;
}

:deep(.presentation-divider) {
	margin-block: 0 var(--theme--form--row-gap);
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

	.name-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.name {
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
