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
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import DeploymentNavigation from '../components/navigation.vue';

interface Project {
	id: string;
	external_id: string;
	name: string;
	url?: string;
	framework?: string;
	latest_deployment?: {
		status: string;
		created_at: string;
		finished_at?: string;
	};
}

interface DeploymentConfig {
	id: string;
	type: string;
}

const props = defineProps<{
	provider: string;
}>();

const { t } = useI18n();

const loading = ref(true);
const deploying = ref<string | null>(null);
const projects = ref<Project[]>([]);
const providers = ref<{ type: string; name: string; icon: string }[]>([]);

// Provider metadata
const PROVIDER_META: Record<string, { name: string; icon: string }> = {
	vercel: { name: 'Vercel', icon: 'cloud' },
};

const providerName = computed(() => PROVIDER_META[props.provider]?.name || props.provider);

const tableHeaders = ref<Header[]>([
	{
		text: t('name'),
		value: 'name',
		width: 200,
		sortable: true,
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
		text: t('framework'),
		value: 'framework',
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

async function loadProjects() {
	loading.value = true;

	try {
		const response = await api.get<{ data: Project[] }>(`/deployment/${props.provider}/dashboard`);
		projects.value = response.data.data;
	} catch {
		projects.value = [];
	} finally {
		loading.value = false;
	}
}

async function triggerDeployment(project: Project) {
	if (deploying.value) return;

	deploying.value = project.id;

	try {
		await api.post(`/deployment/${props.provider}/projects/${project.id}/deploy`);
		// Refresh to get updated status
		await loadProjects();
	} catch (error) {
		console.error('Deploy failed:', error);
	} finally {
		deploying.value = null;
	}
}

function refresh() {
	loadProjects();
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

onMounted(() => {
	loadProviders();
	loadProjects();
});
</script>

<template>
	<PrivateView :title="providerName" icon="cloud">
		<template #navigation>
			<DeploymentNavigation :providers="providers" />
		</template>

		<template #actions>
			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('refresh')" secondary icon="refresh" @click="refresh" />
		</template>

		<div v-if="loading" class="loading">
			<VProgressCircular indeterminate />
		</div>

		<VInfo v-else-if="projects.length === 0" icon="folder_off" :title="$t('no_projects')" center>
			{{ $t('no_projects_copy') }}
		</VInfo>

		<VTable
			v-else
			v-model:headers="tableHeaders"
			:items="projects"
			show-resize
			fixed-header
			item-key="id"
			@click:row="({ item }) => $router.push(`/deployment/${provider}/${item.id}/runs`)"
		>
			<template #[`item.status`]="{ item }">
				<div class="status">
					<VIcon name="circle" :color="getStatusColor(item.latest_deployment?.status)" small filled />
					<span>{{ item.latest_deployment?.status || 'unknown' }}</span>
				</div>
			</template>

			<template #[`item.url`]="{ item }">
				<a v-if="item.url" :href="item.url" target="_blank" class="url" @click.stop>
					{{ item.url }}
				</a>
				<span v-else class="no-url">—</span>
			</template>

			<template #item-append="{ item }">
				<VButton
					v-tooltip.bottom="$t('deploy')"
					:loading="deploying === item.id"
					secondary
					small
					icon
					@click.stop="triggerDeployment(item)"
				>
					<VIcon name="rocket_launch" />
				</VButton>
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

