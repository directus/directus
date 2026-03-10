<script setup lang="ts">
import {
	type DeploymentRunsOutput,
	type DeploymentRunStatsOutput,
	readDeploymentRunStats,
	triggerDeployment,
} from '@directus/sdk';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DeploymentStatus from '../../components/deployment-status.vue';
import DeploymentNavigation from '../../components/navigation.vue';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import api from '@/api';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { Header } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { sdk } from '@/sdk';
import { usePermissionsStore } from '@/stores/permissions';
import { formatDurationMs } from '@/utils/format-duration-ms';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { unexpectedError } from '@/utils/unexpected-error';
import { userName } from '@/utils/user-name';
import { PrivateView } from '@/views/private';
import SearchInput from '@/views/private/components/search-input.vue';

type Run = DeploymentRunsOutput;

const props = defineProps<{
	provider: string;
	projectId: string;
}>();

const router = useRouter();
const { t } = useI18n();
const { currentProject } = useDeploymentNavigation();
const canDeploy = usePermissionsStore().hasPermission('directus_deployment_runs', 'create');

const loading = ref(true);
const deploying = ref(false);
const runs = ref<Run[]>([]);
const search = ref<string | null>(null);
const totalCount = ref(0);

const stats = ref<DeploymentRunStatsOutput>({
	total_deployments: 0,
	average_build_time: null,
	failed_builds: 0,
	successful_builds: 0,
});

const statsRange = ref('7d');

const rangeOptions = [
	{ text: t('deployment.range.1d'), value: '1d' },
	{ text: t('deployment.range.7d'), value: '7d' },
	{ text: t('deployment.range.30d'), value: '30d' },
];

const page = ref(1);
const limit = 10;
const totalPages = computed(() => Math.ceil(totalCount.value / limit) || 1);

// Reset to page 1 on search change
watch(search, () => {
	page.value = 1;
	refresh();
});

watch(page, (newPage, oldPage) => {
	if (newPage !== oldPage) refresh();
});

const pageTitle = computed(() => currentProject.value?.name || t('deployment.provider.runs.runs'));

const tableHeaders = ref<Header[]>([
	{
		text: t('deployment.provider.runs.id'),
		value: 'name',
		width: 200,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('status'),
		value: 'status',
		width: 120,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('deployment.target'),
		value: 'target',
		width: 120,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('deployment.provider.runs.started'),
		value: 'date_created',
		width: 180,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('duration'),
		value: 'duration',
		width: 100,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('deployment.provider.runs.author'),
		value: 'user_created',
		width: 150,
		sortable: false,
		align: 'left',
		description: null,
	},
]);

async function loadRuns() {
	try {
		const offset = (page.value - 1) * limit;

		const response = await api.get(`/deployments/${props.provider}/projects/${props.projectId}/runs`, {
			params: {
				search: search.value || undefined,
				offset,
				meta: 'filter_count',
			},
		});

		runs.value = response.data.data as Run[];
		totalCount.value = response.data.meta?.filter_count ?? 0;
	} catch (error) {
		if (runs.value.length === 0) {
			unexpectedError(error);
		}
	}
}

const successRate = computed(() => {
	if (stats.value.total_deployments === 0) return null;
	return Math.round((stats.value.successful_builds / stats.value.total_deployments) * 100);
});

async function loadStats() {
	try {
		stats.value = await sdk.request(
			readDeploymentRunStats(props.provider, props.projectId, { range: statsRange.value }),
		);
	} catch (error) {
		unexpectedError(error);
	}
}

async function refresh() {
	loading.value = true;

	try {
		await Promise.all([loadRuns(), loadStats()]);
	} finally {
		loading.value = false;
	}
}

async function deploy(preview = false) {
	deploying.value = true;

	try {
		const result = await sdk.request(
			triggerDeployment(props.provider, props.projectId, preview ? { preview: true } : undefined),
		);

		router.push(`/deployments/${props.provider}/${props.projectId}/runs/${result.id}`);
	} catch (error) {
		unexpectedError(error);
	} finally {
		deploying.value = false;
	}
}

const runItems = computed(() =>
	runs.value.map((run) => ({
		...run,
		formattedDate: localizedFormatDistance(new Date(run.date_created), new Date(), { addSuffix: true }),
		formattedDuration:
			run.completed_at && run.started_at
				? formatDurationMs(new Date(run.completed_at).getTime() - new Date(run.started_at).getTime())
				: '—',
	})),
);

watch(
	() => props.projectId,
	() => refresh(),
	{ immediate: true },
);

watch(statsRange, loadStats);
</script>

<template>
	<PrivateView :title="pageTitle" show-back :back-to="`/deployments/${provider}`">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t(`deployment.provider.${provider}.name`), to: `/deployments/${provider}` }]" />
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<SearchInput v-if="totalCount > 0 || search" v-model="search" :show-filter="false" small />

			<VButton
				:tooltip="$t('deployment.deploy')"
				rounded
				icon
				small
				:loading="deploying"
				:disabled="!canDeploy"
				@click="deploy()"
			>
				<VIcon name="rocket_launch" small />

				<template #append-outer>
					<VMenu show-arrow>
						<template #activator="{ toggle }">
							<VIcon class="more-options" name="more_vert" clickable @click="toggle" />
						</template>

						<VList>
							<VListItem clickable :disabled="deploying || !canDeploy" @click="deploy(true)">
								<VListItemIcon><VIcon name="rocket_launch" /></VListItemIcon>
								<VListItemContent>{{ $t('deployment.provider.runs.deploy_preview') }}</VListItemContent>
							</VListItem>
							<VListItem clickable @click="refresh">
								<VListItemIcon><VIcon name="refresh" /></VListItemIcon>
								<VListItemContent>{{ $t('deployment.provider.runs.refresh') }}</VListItemContent>
							</VListItem>
						</VList>
					</VMenu>
				</template>
			</VButton>
		</template>

		<VProgressCircular v-if="loading" class="spinner" indeterminate />

		<div v-else class="container">
			<VSelect v-model="statsRange" :items="rangeOptions" inline label class="range-select" />

			<div class="stats-bar">
				<div class="stat-card">
					<VIcon name="deployed_code" class="stat-icon" />
					<span>
						{{
							$t('deployment.dashboard.total_deployments', { count: stats.total_deployments }, stats.total_deployments)
						}}
					</span>
				</div>

				<div class="stat-card">
					<VIcon name="timer" class="stat-icon" />
					<span>
						{{
							$t('deployment.dashboard.average_build_time', {
								value: stats.average_build_time !== null ? formatDurationMs(stats.average_build_time) : '—',
							})
						}}
					</span>
				</div>

				<div class="stat-card danger">
					<VIcon name="error" class="stat-icon" />
					<span>
						{{ $t('deployment.dashboard.failed_builds', { count: stats.failed_builds }, stats.failed_builds) }}
					</span>
				</div>

				<div class="stat-card success">
					<VIcon name="check" class="stat-icon" />
					<span>
						{{ $t('deployment.dashboard.success_rate', { value: successRate !== null ? successRate : '—' }) }}
					</span>
				</div>
			</div>

			<VInfo v-if="runs.length === 0 && !search" icon="history" :title="$t('deployment.provider.runs.empty')" center>
				{{ $t('deployment.provider.runs.empty_copy') }}
			</VInfo>

			<VInfo v-else-if="runs.length === 0 && search" :title="$t('no_results')" icon="search" center>
				{{ $t('no_results_copy') }}

				<template #append>
					<VButton @click="search = null">{{ $t('clear_filters') }}</VButton>
				</template>
			</VInfo>

			<template v-else>
				<VTable
					v-model:headers="tableHeaders"
					:items="runItems"
					show-resize
					fixed-header
					item-key="id"
					@click:row="({ item }) => $router.push(`/deployments/${provider}/${projectId}/runs/${item.id}`)"
				>
					<template #[`item.name`]="{ item }">
						<span class="run-name">{{ item.name || item.external_id }}</span>
					</template>

					<template #[`item.status`]="{ item }">
						<DeploymentStatus :status="item.status" />
					</template>

					<template #[`item.target`]="{ item }">
						{{ $t(`deployment.target_value.${item.target}`) }}
					</template>

					<template #[`item.date_created`]="{ item }">
						{{ item.formattedDate }}
					</template>

					<template #[`item.duration`]="{ item }">
						{{ item.formattedDuration }}
					</template>

					<template #[`item.user_created`]="{ item }">
						{{ item.user_created ? userName(item.user_created) : $t('deployment.provider.runs.external_user') }}
					</template>
				</VTable>

				<div v-if="totalPages > 1" class="pagination">
					<VPagination v-model="page" :length="totalPages" :total-visible="5" show-first-last />
				</div>
			</template>
		</div>
	</PrivateView>
</template>

<style scoped lang="scss">
.container {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.range-select {
	display: block;
	margin-block-end: 16px;
}

.stats-bar {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	margin-block-end: 16px;

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

.spinner {
	margin: 120px auto;
}

.run-name {
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 13px;
}

:deep(.v-table .table-row) {
	cursor: pointer;
}

.pagination {
	display: flex;
	justify-content: center;
	margin-block-start: 24px;
}

.more-options.v-icon {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	color: var(--theme--foreground-subdued);

	&:hover {
		color: var(--theme--foreground);
	}
}
</style>
