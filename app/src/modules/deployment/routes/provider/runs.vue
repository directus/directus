<script setup lang="ts">
import { type DeploymentRunsOutput, triggerDeployment } from '@directus/sdk';
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
import VNotice from '@/components/v-notice.vue';
import VPagination from '@/components/v-pagination.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import { Header } from '@/components/v-table/types';
import VTable from '@/components/v-table/v-table.vue';
import { sdk } from '@/sdk';
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

const loading = ref(true);
const deploying = ref(false);
const runs = ref<Run[]>([]);
const search = ref<string | null>(null);
const totalCount = ref(0);

const page = ref(1);
const limit = 10;
const totalPages = computed(() => Math.ceil(totalCount.value / limit) || 1);

// Reset to page 1 on search change
watch(search, () => {
	page.value = 1;
	loadRuns();
});

watch(page, (newPage, oldPage) => {
	if (newPage !== oldPage) loadRuns();
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
	loading.value = true;

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
	} finally {
		loading.value = false;
	}
}

function refresh() {
	loadRuns();
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
		formattedDuration: run.finished_at
			? formatDurationMs(new Date(run.finished_at).getTime() - new Date(run.date_created).getTime())
			: '—',
	})),
);

watch(
	() => props.projectId,
	() => {
		loadRuns();
	},
	{ immediate: true },
);
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

			<VButton v-tooltip.bottom="$t('deployment.deploy')" rounded icon small :loading="deploying" @click="deploy()">
				<VIcon name="rocket_launch" small />

				<template #append-outer>
					<VMenu show-arrow>
						<template #activator="{ toggle }">
							<VIcon class="more-options" name="more_vert" clickable @click="toggle" />
						</template>

						<VList>
							<VListItem clickable :disabled="deploying" @click="deploy(true)">
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
			<VNotice class="notice">{{ $t('deployment.provider.runs.notice') }}</VNotice>
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
						{{ item.user_created ? userName(item.user_created) : '—' }}
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

.notice {
	margin-block-end: var(--theme--form--row-gap);
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
