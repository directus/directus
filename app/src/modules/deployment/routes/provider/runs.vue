<script setup lang="ts">
import api from '@/api';
import { sdk } from '@/sdk';
import {
	readDeploymentDashboard,
	triggerDeployment,
	type DeploymentDashboardOutput,
} from '@directus/sdk';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VMenu from '@/components/v-menu.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { Header } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import SearchInput from '@/views/private/components/search-input.vue';
import DeploymentNavigation from '../../components/navigation.vue';
import DeploymentStatus from '../../components/deployment-status.vue';
import { PrivateView } from '@/views/private';
import { unexpectedError } from '@/utils/unexpected-error';
import { formatDistanceToNow } from 'date-fns';
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

interface Run {
	id: string;
	project: string;
	external_id: string;
	target: string;
	status: 'building' | 'ready' | 'error' | 'canceled';
	url?: string;
	date_created: string;
	finished_at?: string;
	author?: string;
}

type Project = DeploymentDashboardOutput['projects'][number];

const props = defineProps<{
	provider: string;
	projectId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const deploying = ref(false);
const runs = ref<Run[]>([]);
const project = ref<Project | null>(null);
const search = ref<string | null>(null);
const totalCount = ref(0);

// Pagination (server-side)
const page = ref(1);
const limit = 25;

const totalPages = computed(() => Math.ceil(totalCount.value / limit) || 1);

// Reset to page 1 and reload when search changes
watch(search, () => {
	page.value = 1;
	loadRuns();
});

// Reload when page changes
watch(page, (newPage, oldPage) => {
	if (newPage !== oldPage) loadRuns();
});

const pageTitle = computed(() => project.value?.name || t('deployment_runs'));

const tableHeaders = ref<Header[]>([
	{
		text: t('deployment_runs_id'),
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
		text: t('deployment_target'),
		value: 'target',
		width: 120,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('deployment_runs_started'),
		value: 'date_created',
		width: 150,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('duration'),
		value: 'duration',
		width: 120,
		sortable: false,
		align: 'left',
		description: null,
	},
	{
		text: t('deployment_runs_author'),
		value: 'author',
		width: 150,
		sortable: false,
		align: 'left',
		description: null,
	},
]);

async function loadRuns() {
	loading.value = true;

	try {
		const offset = (page.value - 1) * limit;

		const response = await api.get(`/deployment/${props.provider}/projects/${props.projectId}/runs`, {
			params: {
				search: search.value || undefined,
				limit,
				offset,
				meta: 'filter_count',
			},
		});

		runs.value = response.data.data as Run[];
		totalCount.value = response.data.meta?.filter_count ?? response.data.data.length;
	} catch (error) {
		if (runs.value.length === 0) {
			unexpectedError(error);
		}
	} finally {
		loading.value = false;
	}
}

async function loadProject() {
	try {
		const data = await sdk.request(readDeploymentDashboard(props.provider));
		project.value = data.projects.find((p: any) => p.id === props.projectId) || null;
	} catch {
		project.value = null;
	}
}

function refresh() {
	loadRuns();
}

function clearFilters() {
	search.value = null;
}

async function deploy(preview = false) {
	if (!project.value) return;

	deploying.value = true;

	try {
		const result = await sdk.request(
			triggerDeployment(props.provider, project.value.id, preview ? { preview: true } : undefined),
		);

		if (result?.id) {
			router.push(`/deployment/${props.provider}/${props.projectId}/runs/${result.id}`);
		} else {
			refresh();
		}
	} catch (error) {
		unexpectedError(error);
	} finally {
		deploying.value = false;
	}
}

function formatRelativeTime(date: string): string {
	return formatDistanceToNow(new Date(date), { addSuffix: false }) + ' ago';
}

function formatDurationMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;

	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes === 0) return `${seconds}s`;
	return `${minutes}m ${remainingSeconds}s`;
}

function formatDuration(run: Run): string {
	if (!run.finished_at) return '—';

	const start = new Date(run.date_created).getTime();
	const end = new Date(run.finished_at).getTime();
	return formatDurationMs(end - start);
}

watch(() => props.projectId, () => {
	loadProject();
	loadRuns();
}, { immediate: true });
</script>

<template>
	<PrivateView :title="pageTitle">
		<template #headline>
			<VBreadcrumb
				:items="[
					{ name: $t(`deployment_provider_${provider}`), to: `/deployment/${provider}` },
				]"
			/>
		</template>

		<template #title-outer:prepend>
			<VButton class="back-button" rounded icon secondary exact small @click="router.push(`/deployment/${provider}`)">
				<VIcon name="arrow_back" small />
			</VButton>
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<SearchInput
				v-if="totalCount > 0 || search"
				v-model="search"
				:show-filter="false"
				small
			/>

			<VButton v-tooltip.bottom="$t('deploy')" rounded icon :loading="deploying" @click="deploy()">
				<VIcon name="rocket_launch" />
			</VButton>

			<VMenu placement="bottom-end" show-arrow>
				<template #activator="{ toggle }">
					<VButton rounded icon secondary @click="toggle">
						<VIcon name="more_vert" />
					</VButton>
				</template>

				<VList>
					<VListItem clickable :disabled="deploying" @click="deploy(true)">
						<VListItemIcon><VIcon name="rocket_launch" /></VListItemIcon>
						<VListItemContent>{{ $t('deployment_runs_deploy_preview') }}</VListItemContent>
					</VListItem>
					<VListItem clickable @click="refresh">
						<VListItemIcon><VIcon name="refresh" /></VListItemIcon>
						<VListItemContent>{{ $t('refresh') }}</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
		</template>

		<div class="container">
			<VProgressCircular v-if="loading" class="spinner" indeterminate />

			<template v-else>
				<VInfo v-if="runs.length === 0 && !search" icon="history" :title="$t('no_runs')" center>
					{{ $t('no_runs_copy') }}
				</VInfo>

				<VInfo v-else-if="runs.length === 0 && search" :title="$t('no_results')" icon="search" center>
					{{ $t('no_results_copy') }}

					<template #append>
						<VButton @click="clearFilters">{{ $t('clear_filters') }}</VButton>
					</template>
				</VInfo>

				<template v-else>
					<VTable
						v-model:headers="tableHeaders"
						:items="runs"
						show-resize
						fixed-header
						item-key="id"
						@click:row="({ item }) => $router.push(`/deployment/${provider}/${projectId}/runs/${item.id}`)"
					>
						<template #[`item.name`]="{ item }">
							<span class="run-name">{{ item.name || item.external_id }}</span>
						</template>

						<template #[`item.status`]="{ item }">
							<DeploymentStatus :status="item.status" />
						</template>

						<template #[`item.target`]="{ item }">
							{{ item.target }}
						</template>

						<template #[`item.date_created`]="{ item }">
							{{ formatRelativeTime(item.date_created) }}
						</template>

						<template #[`item.duration`]="{ item }">
							{{ formatDuration(item) }}
						</template>

						<template #[`item.author`]="{ item }">
							{{ item.author || '—' }}
						</template>
					</VTable>

					<div v-if="totalPages > 1" class="pagination">
						<VPagination v-model="page" :length="totalPages" :total-visible="5" show-first-last />
					</div>
				</template>
			</template>
		</div>
	</PrivateView>
</template>

<style scoped lang="scss">
.back-button {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-active: var(--theme--foreground);
}

.container {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
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
</style>
