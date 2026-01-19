<script setup lang="ts">
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInfo from '@/components/v-info.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { Header } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { PrivateView } from '@/views/private';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { format } from 'date-fns';
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DeploymentNavigation from '../components/navigation.vue';

interface Run {
	id: string;
	external_id: string;
	target: string;
	status: string;
	url?: string;
	date_created: string;
	finished_at?: string;
	error_message?: string;
}

interface DeploymentConfig {
	id: string;
	type: string;
}

interface Project {
	id: string;
	name: string;
}

const props = defineProps<{
	provider: string;
	projectId: string;
}>();

const { t } = useI18n();

const loading = ref(true);
const runs = ref<Run[]>([]);
const project = ref<Project | null>(null);
const providers = ref<{ type: string; name: string; icon: string }[]>([]);

// Provider metadata
const PROVIDER_META: Record<string, { name: string; icon: string }> = {
	vercel: { name: 'Vercel', icon: 'cloud' },
};

const pageTitle = computed(() => project.value?.name || 'Runs');

const tableHeaders = ref<Header[]>([
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
		text: t('date_created'),
		value: 'date_created',
		width: 200,
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
		text: t('url'),
		value: 'url',
		width: 300,
		sortable: false,
		align: 'left',
		description: null,
	},
]);

async function loadProviders() {
	try {
		const response = await api.get<{ data: DeploymentConfig[] }>('/deployment');

		providers.value = response.data.data.map((config) => ({
			type: config.type,
			name: PROVIDER_META[config.type]?.name || config.type,
			icon: PROVIDER_META[config.type]?.icon || 'cloud',
		}));
	} catch {
		providers.value = [];
	}
}

async function loadRuns() {
	loading.value = true;

	try {
		const response = await api.get<{ data: Run[] }>(`/deployment/${props.provider}/projects/${props.projectId}/runs`);
		runs.value = response.data.data;
	} catch {
		runs.value = [];
	} finally {
		loading.value = false;
	}
}

async function loadProject() {
	try {
		// Get project name from the dashboard endpoint
		const response = await api.get<{ data: Project[] }>(`/deployment/${props.provider}/dashboard`);
		project.value = response.data.data.find((p) => p.id === props.projectId) || null;
	} catch {
		project.value = null;
	}
}

function refresh() {
	loadRuns();
}

function getStatusColor(status?: string): string {
	switch (status) {
		case 'ready':
			return 'var(--theme--success)';
		case 'building':
		case 'queued':
			return 'var(--theme--warning)';
		case 'error':
		case 'canceled':
			return 'var(--theme--danger)';
		default:
			return 'var(--theme--foreground-subdued)';
	}
}

function formatDate(date: string): string {
	return format(new Date(date), 'PPp');
}

function formatDuration(run: Run): string {
	if (!run.finished_at) return '—';

	const start = new Date(run.date_created).getTime();
	const end = new Date(run.finished_at).getTime();
	const durationMs = end - start;

	if (durationMs < 1000) return `${durationMs}ms`;
	if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
	return `${Math.round(durationMs / 60000)}m`;
}

onMounted(() => {
	loadProviders();
	loadProject();
	loadRuns();
});
</script>

<template>
	<PrivateView :title="pageTitle" icon="history">
		<template #headline>
			<VButton :to="`/deployment/${provider}`" secondary x-small icon>
				<VIcon name="arrow_back" />
			</VButton>
		</template>

		<template #navigation>
			<DeploymentNavigation :providers="providers" />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('refresh')" secondary icon="refresh" @click="refresh" />
		</template>

		<div v-if="loading" class="loading">
			<VProgressCircular indeterminate />
		</div>

		<VInfo v-else-if="runs.length === 0" icon="history" :title="$t('no_runs')" center>
			{{ $t('no_runs_copy') }}
		</VInfo>

		<VTable v-else v-model:headers="tableHeaders" :items="runs" show-resize fixed-header item-key="id">
			<template #[`item.status`]="{ item }">
				<div class="status">
					<VIcon name="circle" :color="getStatusColor(item.status)" small filled />
					<span>{{ item.status }}</span>
				</div>
			</template>

			<template #[`item.target`]="{ item }">
				<span class="target" :class="item.target">{{ item.target }}</span>
			</template>

			<template #[`item.date_created`]="{ item }">
				{{ formatDate(item.date_created) }}
			</template>

			<template #[`item.duration`]="{ item }">
				{{ formatDuration(item) }}
			</template>

			<template #[`item.url`]="{ item }">
				<a v-if="item.url" :href="item.url" target="_blank" class="url" @click.stop>
					{{ item.url }}
				</a>
				<span v-else class="no-url">—</span>
			</template>
		</VTable>
	</PrivateView>
</template>

<style scoped lang="scss">
.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
}

.v-table {
	padding: var(--content-padding);
}

.status {
	display: flex;
	align-items: center;
	gap: 8px;
}

.target {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
	text-transform: uppercase;

	&.production {
		background-color: var(--theme--primary-background);
		color: var(--theme--primary);
	}

	&.preview {
		background-color: var(--theme--secondary-background);
		color: var(--theme--secondary);
	}
}

.url {
	color: var(--theme--primary);
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
}

.no-url {
	color: var(--theme--foreground-subdued);
}
</style>

