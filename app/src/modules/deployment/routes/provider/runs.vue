<script setup lang="ts">
import {
	type DeploymentRunsOutput,
	type DeploymentRunStatsOutput,
	readDeployment,
	readDeploymentRunStats,
	triggerDeployment,
} from '@directus/sdk';
import type { DeploymentProviderCapabilities } from '@directus/types';
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DeploymentStatus from '../../components/deployment-status.vue';
import DeploymentNavigation from '../../components/navigation.vue';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import {
	buildDeployToolbarActions,
	type DeployToolbarAction,
	formatDeploymentTargetLabel,
	resolveDeploymentCapabilities,
} from '../../config/providers';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
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
import { PrivateView, PrivateViewHeaderBarActionButton } from '@/views/private';
import SearchInput from '@/views/private/components/search-input.vue';

type Run = DeploymentRunsOutput;

/** Same cadence as run detail polling; list must re-fetch so statuses refresh (poll providers + webhook-updated rows). */
const RUNS_LIST_POLL_INTERVAL_MS = 3000;

const props = defineProps<{
	provider: string;
	projectId: string;
}>();

const router = useRouter();
const { t } = useI18n();
const { currentProject } = useDeploymentNavigation();
const canDeploy = usePermissionsStore().hasPermission('directus_deployment_runs', 'create');
const canTriggerDeploy = computed(() => canDeploy && currentProject.value?.deployable !== false);

const capabilitiesFromApi = ref<DeploymentProviderCapabilities | null>(null);
const mergedCapabilities = computed(() => resolveDeploymentCapabilities(props.provider, capabilitiesFromApi.value));

const deployHooks = computed(() => {
	if (!mergedCapabilities.value.supportsDeployHookUrl) return [];

	const projectExternalId = currentProjectExternalId.value;
	if (!projectExternalId) return [];

	const hooks = hooksByProject.value[projectExternalId];
	if (!Array.isArray(hooks)) return [];

	return hooks.filter((hook) => typeof hook?.name === 'string' && typeof hook?.url === 'string') as Array<{
		name: string;
		url: string;
	}>;
});

const deployToolbarActions = computed(() => buildDeployToolbarActions(mergedCapabilities.value, deployHooks.value));

const loading = ref(true);
const deploying = ref(false);
const runs = ref<Run[]>([]);
const search = ref<string | null>(null);
const totalCount = ref(0);
const hooksByProject = ref<Record<string, Array<{ name: string; url: string }>>>({});
const currentProjectExternalId = ref<string | null>(null);

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

const deploymentTargetLabel = (target: string) => formatDeploymentTargetLabel(target, t);

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

const hasActiveDeployment = computed(() => runs.value.some((r) => r.status === 'building'));

let runsListPollTimer: ReturnType<typeof setInterval> | null = null;

function stopRunsListPolling() {
	if (runsListPollTimer) {
		clearInterval(runsListPollTimer);
		runsListPollTimer = null;
	}
}

async function pollRunsListWhileBuilding() {
	await loadRuns();
	await loadStats();

	if (!runs.value.some((r) => r.status === 'building')) {
		stopRunsListPolling();
	}
}

function startRunsListPolling() {
	if (runsListPollTimer) return;

	// One immediate refresh when builds become active (e.g. navigating back to this page).
	void pollRunsListWhileBuilding();

	runsListPollTimer = setInterval(() => {
		void pollRunsListWhileBuilding();
	}, RUNS_LIST_POLL_INTERVAL_MS);
}

async function loadDeployHookConfig() {
	try {
		const deployment = await sdk.request(
			readDeployment(props.provider, {
				fields: ['options', { projects: ['id', 'external_id'] }],
			} as Parameters<typeof readDeployment>[1]),
		);

		capabilitiesFromApi.value =
			(deployment as { capabilities?: DeploymentProviderCapabilities | null }).capabilities ?? null;

		const projects = (deployment as any)?.projects;
		const options = (deployment as any)?.options as Record<string, unknown> | null;

		if (Array.isArray(projects)) {
			const project = projects.find((entry: any) => entry?.id === props.projectId);
			currentProjectExternalId.value = project?.external_id ?? null;
		} else {
			currentProjectExternalId.value = (currentProject.value as any)?.external_id ?? null;
		}

		const hookMap = options?.deploy_hooks_by_project;

		hooksByProject.value =
			hookMap && typeof hookMap === 'object' ? (hookMap as Record<string, Array<{ name: string; url: string }>>) : {};
	} catch {
		capabilitiesFromApi.value = null;
		currentProjectExternalId.value = (currentProject.value as any)?.external_id ?? null;
		hooksByProject.value = {};
	}
}

async function refresh() {
	loading.value = true;

	try {
		await Promise.all([loadRuns(), loadStats(), loadDeployHookConfig()]);
	} finally {
		loading.value = false;
	}
}

function onDeployToolbarAction(action: DeployToolbarAction) {
	if (action.kind === 'refresh') {
		void refresh();
		return;
	}

	if (action.kind === 'default') {
		void deploy();
		return;
	}

	if (action.kind === 'preview') {
		void deploy({ preview: true });
		return;
	}

	if (action.kind === 'deploy_hook') {
		void deploy({ deployHookUrl: action.url });
	}
}

async function deploy(options?: { preview?: boolean; deployHookUrl?: string }) {
	deploying.value = true;

	try {
		const requestOptions: Record<string, any> = {};
		if (options?.preview) requestOptions.preview = true;
		if (options?.deployHookUrl) requestOptions.deploy_hook_url = options.deployHookUrl;

		const result = await sdk.request(
			triggerDeployment(
				props.provider,
				props.projectId,
				Object.keys(requestOptions).length > 0 ? requestOptions : undefined,
			),
		);

		router.push({
			name: 'deployments-provider-run',
			params: { provider: props.provider, projectId: props.projectId, runId: result.id },
		});
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

watch(
	hasActiveDeployment,
	(active) => {
		if (active) {
			startRunsListPolling();
		} else {
			stopRunsListPolling();
		}
	},
	{ immediate: true },
);

onUnmounted(() => {
	stopRunsListPolling();
});
</script>

<template>
	<PrivateView :title="pageTitle" show-back :back-to="`/deployments/${provider}`">
		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<SearchInput v-if="totalCount > 0 || search" v-model="search" :show-filter="false" small />
		</template>

		<template #actions:primary>
			<PrivateViewHeaderBarActionButton
				:label="$t('deployment.deploy')"
				icon="rocket_launch"
				:loading="deploying"
				:disabled="!canTriggerDeploy"
				@click="deploy()"
			>
				<template #split-menu>
					<VList>
						<VListItem
							v-for="action in deployToolbarActions"
							:key="action.id"
							clickable
							:disabled="action.kind === 'refresh' ? false : deploying || !canTriggerDeploy"
							@click="onDeployToolbarAction(action)"
						>
							<VListItemIcon>
								<VIcon
									:name="
										action.kind === 'refresh' ? 'refresh' : action.kind === 'deploy_hook' ? 'webhook' : 'rocket_launch'
									"
								/>
							</VListItemIcon>
							<VListItemContent>
								<template v-if="action.kind === 'default'">{{ $t('deployment.deploy') }}</template>
								<template v-else-if="action.kind === 'preview'">
									{{ $t('deployment.provider.runs.deploy_preview') }}
								</template>
								<template v-else-if="action.kind === 'deploy_hook'">
									{{ $t('deployment.provider.cloudflare-workers.deploy_hooks.deploy_via', { name: action.name }) }}
								</template>
								<template v-else>{{ $t('deployment.provider.runs.refresh') }}</template>
							</VListItemContent>
						</VListItem>
					</VList>
				</template>
			</PrivateViewHeaderBarActionButton>
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
					@click:row="
						({ item }) =>
							$router.push({ name: 'deployments-provider-run', params: { provider, projectId, runId: item.id } })
					"
				>
					<template #[`item.name`]="{ item }">
						<span class="run-name">{{ item.name || item.external_id }}</span>
					</template>

					<template #[`item.status`]="{ item }">
						<DeploymentStatus :status="item.status" />
					</template>

					<template #[`item.target`]="{ item }">
						{{ deploymentTargetLabel(item.target) }}
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
@use '@/styles/mixins';

.container {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.range-select {
	display: block;
	margin-block-end: 0.875rem;
}

.stats-bar {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 0.875rem;
	margin-block-end: 0.875rem;

	@media (width < 85.0625rem) {
		grid-template-columns: repeat(3, 1fr);
	}

	@include mixins.breakpoint-down('lg') {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (width < 43.1875rem) {
		grid-template-columns: 1fr;
	}
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 0.4375rem;
	padding: 0.3125rem 0.5625rem;
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
	margin: 6.75rem auto;
}

.run-name {
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 0.75rem;
}

:deep(.v-table .table-row) {
	cursor: pointer;
}

.pagination {
	display: flex;
	justify-content: center;
	margin-block-start: 1.375rem;
}
</style>
