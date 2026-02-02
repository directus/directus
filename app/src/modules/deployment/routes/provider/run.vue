<script setup lang="ts">
import { cancelDeployment, type DeploymentRunsOutput, readDeploymentRun } from '@directus/sdk';
import type { Log as DeploymentLog } from '@directus/types';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
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
import { sdk } from '@/sdk';
import { formatDurationMs } from '@/utils/format-duration-ms';
import { unexpectedError } from '@/utils/unexpected-error';
import { PrivateView } from '@/views/private';

const props = defineProps<{
	provider: string;
	projectId: string;
	runId: string;
}>();

const router = useRouter();
const { t } = useI18n();
const { currentProject } = useDeploymentNavigation();

const loading = ref(true);
const canceling = ref(false);
const confirmCancel = ref(false);
const run = ref<DeploymentRunsOutput | null>(null);
const logs = ref<DeploymentLog[]>([]);
const lastLogTimestamp = ref<string | null>(null);
const logsContainer = ref<HTMLElement | null>(null);
const shouldAutoScroll = ref(true);

// Polling
const POLL_INTERVAL = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Filters
const logLevelFilter = ref<string>('all');
const searchQuery = ref('');

const logLevelOptions = [
	{ text: t('deployment.provider.run.log_all'), value: 'all' },
	{ text: 'Info', value: 'info' },
	{ text: 'Stdout', value: 'stdout' },
	{ text: 'Stderr', value: 'stderr' },
];

const pageTitle = computed(() =>
	currentProject.value?.name
		? t('deployment.provider.run.title', { project: currentProject.value.name })
		: t('loading'),
);

const isBuilding = computed(() => run.value?.status === 'building');

const logItems = computed(() => {
	let result = logs.value;

	// Filter by log level
	if (logLevelFilter.value !== 'all') {
		result = result.filter((log) => log.type === logLevelFilter.value);
	}

	// Filter by search query
	if (searchQuery.value.trim()) {
		const query = searchQuery.value.toLowerCase();
		result = result.filter((log) => log.message.toLowerCase().includes(query));
	}

	return result.map((log) => ({
		...log,
		formattedTime: format(new Date(log.timestamp), 'HH:mm:ss'),
	}));
});

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
				if (logsContainer.value && shouldAutoScroll.value) {
					logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
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

function handleLogsScroll() {
	if (!logsContainer.value) return;

	const { scrollTop, scrollHeight, clientHeight } = logsContainer.value;
	// Consider "at bottom" if within 50px of the bottom
	const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
	shouldAutoScroll.value = isAtBottom;
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
	<PrivateView :title="pageTitle">
		<template #headline>
			<VBreadcrumb :items="[{ name: $t(`deployment.provider.${provider}.name`), to: `/deployment/${provider}` }]" />
		</template>

		<template #title-outer:prepend>
			<VButton class="back-button" rounded icon secondary exact small @click="router.back()">
				<VIcon name="arrow_back" small />
			</VButton>
		</template>

		<template #navigation>
			<DeploymentNavigation />
		</template>

		<template #actions>
			<div class="actions-wrapper">
				<span v-if="isBuilding" class="currently-deploying">
					{{ $t('deployment.provider.run.currently_deploying') }}
				</span>

				<VButton
					v-if="isBuilding"
					v-tooltip.bottom="$t('deployment.provider.run.stop')"
					rounded
					icon
					small
					secondary
					class="action-cancel"
					:loading="canceling"
					@click="confirmCancel = true"
				>
					<VIcon name="dangerous" outline small />
				</VButton>

				<VButton
					v-tooltip.bottom="$t('deployment.provider.run.download_logs')"
					rounded
					icon
					small
					secondary
					@click="downloadLogs"
				>
					<VIcon name="download" small />
				</VButton>

				<VButton
					v-if="run?.url"
					v-tooltip.bottom="$t('deployment.provider.run.open_deployment')"
					rounded
					icon
					small
					secondary
					@click="openDeployment"
				>
					<VIcon name="open_in_new" small />
				</VButton>
			</div>
		</template>

		<div class="content">
			<VProgressCircular v-if="loading" class="spinner" indeterminate />

			<template v-else-if="run">
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
							class="search-input"
						/>
					</div>
				</div>

				<div ref="logsContainer" class="logs-container" @scroll="handleLogsScroll">
					<div v-if="logItems.length === 0" class="no-logs">
						{{ $t('deployment.provider.run.no_logs') }}
					</div>

					<div v-else class="logs">
						<div v-for="(log, index) in logItems" :key="index" :class="['log-entry', log.type]">
							<span class="log-time">[{{ log.formattedTime }}]</span>
							<span class="log-type">[{{ log.type.toUpperCase() }}]</span>
							<span class="log-message">{{ log.message }}</span>
						</div>
					</div>
				</div>
			</template>
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

.back-button {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-active: var(--theme--foreground);
}

.spinner {
	display: block;
	margin: 100px auto;
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
	min-width: 0;
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
	min-width: 0;

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
	min-height: 400px;
	max-height: calc(100vh - 400px);
	overflow-y: auto;
}

.no-logs {
	display: flex;
	flex: 1;
	align-items: center;
	justify-content: center;
	color: var(--theme--foreground-subdued);
}

.logs {
	font-family: var(--theme--fonts--monospace--font-family);
	font-size: 13px;
	line-height: 1.6;
}

.log-entry {
	display: flex;
	gap: 8px;
	padding: 2px 0;

	&.stderr {
		color: var(--theme--danger);
	}

	&.info {
		color: var(--theme--primary);
	}

	&.stdout {
		color: var(--theme--foreground);
	}
}

.log-time {
	color: var(--theme--foreground-subdued);
	flex-shrink: 0;
}

.log-type {
	flex-shrink: 0;
	min-width: 70px;
}

.log-message {
	white-space: pre-wrap;
	word-break: break-word;
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
