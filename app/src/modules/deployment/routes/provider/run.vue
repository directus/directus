<script setup lang="ts">
import { cancelDeployment, type DeploymentRunsOutput, readDeploymentRun } from '@directus/sdk';
import type { Log as DeploymentLog } from '@directus/types';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import DeploymentStatus from '../../components/deployment-status.vue';
import DeploymentNavigation from '../../components/navigation.vue';
import { useDeploymentNavigation } from '../../composables/use-deployment-navigation';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import LogsDisplay from '@/modules/settings/routes/system-logs/components/logs-display.vue';
import type { Log as SystemLog } from '@/modules/settings/routes/system-logs/types';
import { sdk } from '@/sdk';
import { usePermissionsStore } from '@/stores/permissions';
import { formatDurationMs } from '@/utils/format-duration-ms';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateViewHeaderBarActionButton } from '@/views/private';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	provider: string;
	projectId: string;
	runId: string;
}>();

const { t } = useI18n();
const { currentProject } = useDeploymentNavigation();
const canCancel = usePermissionsStore().hasPermission('directus_deployment_runs', 'update');

const loading = ref(true);
const canceling = ref(false);
const confirmCancel = ref(false);
const run = ref<DeploymentRunsOutput | null>(null);
const logs = ref<DeploymentLog[]>([]);
const lastLogTimestamp = ref<string | null>(null);
const logsDisplay = ref<InstanceType<typeof LogsDisplay>>();
const shouldAutoScroll = ref(true);

// Polling
const POLL_INTERVAL = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Filters
const logLevels = [
	{ type: 'stdout', level: 1, label: 'Stdout' },
	{ type: 'stderr', level: 2, label: 'Stderr' },
	{ type: 'info', level: 3, label: 'Info' },
] as const;

type DeploymentLogLevel = (typeof logLevels)[number]['level'];

const deploymentLogLevels = logLevels.reduce(
	(acc, { type, level }) => {
		acc[type] = level;
		return acc;
	},
	{} as Record<DeploymentLog['type'], number>,
);

const logLevelFilter = ref<'all' | DeploymentLogLevel>('all');
const searchQuery = ref('');

const logLevelOptions = [
	{ text: t('deployment.provider.run.log_all'), value: 'all' },
	...logLevels.map((level) => ({ text: level.label, value: level.level })),
];

const logInstances = ['deployment'];

const pageTitle = computed(() =>
	currentProject.value?.name
		? t('deployment.provider.run.title', { project: currentProject.value.name })
		: t('loading'),
);

const terminalStatuses = new Set(['ready', 'error', 'canceled']);
const isBuilding = computed(() => (run.value ? !terminalStatuses.has(run.value.status) : false));

const filteredLogs = computed(() => {
	let result = logs.value;

	// Filter by log level
	if (logLevelFilter.value !== 'all') {
		result = result.filter((log) => deploymentLogLevels[log.type] === logLevelFilter.value);
	}

	// Filter by search query
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter((log) => log.message.toLowerCase().includes(query));
	}

	return result;
});

const displayLogs = computed<SystemLog[]>(() =>
	filteredLogs.value.map((log, index) => {
		const level = deploymentLogLevels[log.type] ?? deploymentLogLevels.info;

		return {
			index,
			instance: 'deployment',
			data: {
				level,
				time: new Date(log.timestamp).getTime(),
				msg: log.message,
			},
			notice: false,
		};
	}),
);

const duration = computed(() => {
	if (!run.value) return '—';

	const start = new Date(run.value.date_created).getTime();
	const end = run.value.finished_at ? new Date(run.value.finished_at).getTime() : Date.now();

	return formatDurationMs(end - start);
});

async function loadRun() {
	try {
		const params: Record<string, unknown> = {};

		if (lastLogTimestamp.value) {
			params.since = lastLogTimestamp.value;
		}

		const data = await sdk.request(readDeploymentRun(props.provider, props.runId, params));

		run.value = data as DeploymentRunsOutput;

		// Append or replace logs
		if (data.logs && data.logs.length > 0) {
			if (lastLogTimestamp.value) {
				logs.value = [...logs.value, ...data.logs];
			} else {
				logs.value = data.logs;
			}

			const lastLog = data.logs[data.logs.length - 1];

			if (lastLog) {
				const lastTime = new Date(lastLog.timestamp);
				lastTime.setMilliseconds(lastTime.getMilliseconds() + 1);
				lastLogTimestamp.value = lastTime.toISOString();
			}

			// Auto-scroll to bottom only if user hasn't scrolled up
			nextTick(() => {
				if (logsDisplay.value && shouldAutoScroll.value) {
					logsDisplay.value.scrollToBottom();
				}
			});
		}
	} catch (error) {
		// Only show error on initial load
		if (!run.value) {
			unexpectedError(error);
		}
	} finally {
		loading.value = false;
	}
}

async function cancel() {
	if (!run.value) return;

	canceling.value = true;

	try {
		await sdk.request(cancelDeployment(props.provider, props.runId));
		await loadRun();
	} catch (error) {
		unexpectedError(error);
	} finally {
		canceling.value = false;
		confirmCancel.value = false;
	}
}

function downloadLogs() {
	if (logs.value.length === 0) return;

	const content = logs.value
		.map((log) => `[${format(new Date(log.timestamp), 'HH:mm:ss')}] [${log.type.toUpperCase()}] ${log.message}`)
		.join('\n');

	saveAs(
		new Blob([content], { type: 'text/plain;charset=utf-8' }),
		`deployment-logs-${run.value?.external_id || props.runId}.txt`,
	);
}

function openDeployment() {
	window.open(run.value!.url, '_blank');
}

function startPolling() {
	if (pollTimer) return;

	pollTimer = setInterval(() => {
		if (isBuilding.value) {
			loadRun();
		} else {
			stopPolling();
		}
	}, POLL_INTERVAL);
}

function stopPolling() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
	}
}

// Watch for status changes to start/stop polling
watch(isBuilding, (building, wasBuilding) => {
	if (building) {
		startPolling();
	} else {
		stopPolling();

		// If build just finished, do a final fetch to get remaining logs (Vercel may return status before all logs)
		if (wasBuilding) {
			setTimeout(() => loadRun(), 1000);
		}
	}
});

onMounted(async () => {
	await loadRun();

	if (isBuilding.value) {
		startPolling();
	}
});

onUnmounted(() => {
	stopPolling();
});
</script>

<template>
	<PrivateView :title="pageTitle" show-back :back-to="`/deployments/${provider}/${projectId}/runs`">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t(`deployment.provider.${provider}.name`), to: `/deployments/${provider}` }]" />
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<div class="actions-wrapper">
				<span v-if="isBuilding" class="currently-deploying">
					{{ $t('deployment.provider.run.currently_deploying') }}
				</span>

				<PrivateViewHeaderBarActionButton
					v-if="isBuilding && canCancel"
					v-tooltip.bottom="$t('deployment.provider.run.stop')"
					icon="dangerous"
					secondary
					class="action-cancel"
					:loading="canceling"
					@click="confirmCancel = true"
				/>

				<PrivateViewHeaderBarActionButton
					v-tooltip.bottom="$t('deployment.provider.run.download_logs')"
					icon="download"
					secondary
					@click="downloadLogs"
				/>

				<PrivateViewHeaderBarActionButton
					v-if="run?.url"
					v-tooltip.bottom="$t('deployment.provider.run.open_deployment')"
					icon="open_in_new"
					secondary
					@click="openDeployment"
				/>
			</div>
		</template>

		<VProgressCircular v-if="loading" class="spinner" indeterminate />

		<div v-else-if="run" class="content">
			<div class="stats-bar">
				<div class="stat-card deployment-id">
					<VIcon name="assignment" class="stat-icon" />
					<span class="stat-label">{{ $t('deployment.provider.run.id') }}</span>
					<div class="stat-value monospace">
						<VTextOverflow :text="run.external_id" placement="bottom" />
					</div>
				</div>

				<div class="stat-card">
					<VIcon name="schedule" class="stat-icon" />
					<span class="stat-label">{{ $t('duration') }}</span>
					<span class="stat-value">{{ duration }}</span>
				</div>

				<div class="stat-card">
					<VIcon name="planner_review" class="stat-icon" />
					<span class="stat-label">{{ $t('status') }}</span>
					<DeploymentStatus :status="run.status" />
				</div>

				<div class="stat-card">
					<VIcon name="assignment" class="stat-icon" />
					<span class="stat-label">{{ $t('deployment.target') }}</span>
					<span class="stat-value">{{ $t(`deployment.target_value.${run.target}`) }}</span>
				</div>
			</div>

			<div class="log-filters">
				<div class="filter-field">
					<VSelect v-model="logLevelFilter" :items="logLevelOptions" inline />
				</div>
				<div class="filter-field">
					<VIcon class="filter-icon" small name="search" />
					<input
						v-model="searchQuery"
						:placeholder="$t('deployment.provider.run.search_logs')"
						:aria-label="$t('deployment.provider.run.search_logs')"
						class="search-input"
					/>
				</div>
			</div>

			<div class="logs-container">
				<div v-if="displayLogs.length === 0" class="no-logs">
					{{ $t('deployment.provider.run.no_logs') }}
				</div>

				<LogsDisplay
					v-else
					ref="logsDisplay"
					class="logs-display"
					:logs="displayLogs"
					:log-levels="deploymentLogLevels"
					:instances="logInstances"
					:stream-connected="false"
					:show-instance="false"
					@scroll="shouldAutoScroll = false"
					@scrolled-to-bottom="shouldAutoScroll = true"
				/>
			</div>
		</div>

		<VDialog v-model="confirmCancel" @esc="confirmCancel = false">
			<VCard>
				<VCardTitle>{{ $t('deployment.provider.run.cancel_confirm') }}</VCardTitle>
				<VCardActions>
					<VButton secondary @click="confirmCancel = false">{{ $t('cancel') }}</VButton>
					<VButton kind="danger" :loading="canceling" @click="cancel">
						{{ $t('deployment.provider.run.stop') }}
					</VButton>
				</VCardActions>
			</VCard>
		</VDialog>
	</PrivateView>
</template>

<style scoped lang="scss">
.action-cancel {
	--v-button-background-color-hover: var(--theme--danger) !important;
	--v-button-color-hover: var(--white) !important;
}

.spinner {
	margin: 120px auto;
}

.content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}

.stats-bar {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	margin-block-end: 24px;

	// 2 columns
	@media (max-width: 1512px) {
		grid-template-columns: repeat(2, 1fr);
	}

	// 1 column
	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	min-inline-size: 0;
	overflow: hidden;
}

.stat-icon {
	--v-icon-color: var(--theme--foreground);
	flex-shrink: 0;
}

.stat-label {
	color: var(--theme--foreground);
	flex-shrink: 0;
	white-space: nowrap;

	&::after {
		content: ':';
	}
}

.stat-value {
	color: var(--theme--foreground);
	flex: 1;
	min-inline-size: 0;

	&.monospace {
		font-family: var(--theme--fonts--monospace--font-family);
	}
}

.log-filters {
	display: flex;
	gap: 32px;
	flex-wrap: wrap;
	margin-block-end: 16px;
}

.filter-field {
	display: flex;
	align-items: center;
}

.filter-icon {
	margin-inline-end: 4px;
}

.search-input {
	appearance: none;
	border: none;
	border-radius: 0;
	border-block-end: var(--theme--border-width) solid var(--theme--border-color);
	inline-size: 200px;
	background: transparent;
	color: var(--theme--foreground);
	font-family: var(--theme--fonts--sans--font-family);

	&::placeholder {
		color: var(--theme--foreground-subdued);
	}

	&:focus {
		outline: none;
		border-color: var(--theme--primary);
	}
}

.logs-container {
	display: flex;
	flex-direction: column;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	padding: 16px;
	min-block-size: 400px;
	max-block-size: calc(100vh - 400px);
	overflow: hidden;
}

.no-logs {
	display: flex;
	flex: 1;
	align-items: center;
	justify-content: center;
	color: var(--theme--foreground-subdued);
}

.actions-wrapper {
	display: flex;
	align-items: center;
	gap: 8px;
}

.currently-deploying {
	color: var(--theme--foreground-subdued);
	font-style: italic;
	margin-inline-end: 4px;
}
</style>
