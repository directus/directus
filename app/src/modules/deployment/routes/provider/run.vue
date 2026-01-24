<script setup lang="ts">
import { sdk } from '@/sdk';
import { readDeploymentRun, readDeploymentDashboard, cancelDeployment } from '@directus/sdk';
import VBreadcrumb from '@/components/v-breadcrumb.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VProgressCircular from '@/components/v-progress-circular.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { PrivateView } from '@/views/private';
import { unexpectedError } from '@/utils/unexpected-error';
import { format } from 'date-fns';
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import DeploymentNavigation from '../../components/navigation.vue';
import DeploymentStatus from '../../components/deployment-status.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';

interface Log {
	timestamp: string;
	type: 'stdout' | 'stderr' | 'info';
	message: string;
}

interface RunDetails {
	id: string;
	external_id: string;
	name?: string;
	target: string;
	status: string;
	url?: string;
	date_created: string;
	finished_at?: string;
	duration?: number;
	project: string; // Project ID from DB
	logs?: Log[];
}

interface Project {
	id: string;
	external_id: string;
	name: string;
}

const props = defineProps<{
	provider: string;
	projectId: string;
	runId: string;
}>();

const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const canceling = ref(false);
const run = ref<RunDetails | null>(null);
const project = ref<Project | null>(null);
const logs = ref<Log[]>([]);
const lastLogTimestamp = ref<string | null>(null);
const logsContainer = ref<HTMLElement | null>(null);

// Polling
const POLL_INTERVAL = 3000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// Filters
const logLevelFilter = ref<string>('all');
const searchQuery = ref('');

const logLevelOptions = [
	{ text: t('deployment_run_log_all'), value: 'all' },
	{ text: 'Info', value: 'info' },
	{ text: 'Stdout', value: 'stdout' },
	{ text: 'Stderr', value: 'stderr' },
];

const pageTitle = computed(() => {
	const projectName = project.value?.name || t('deployment_run');
	return `${projectName}: ${t('deployment_run_details')}`;
});

const isBuilding = computed(() => run.value?.status === 'building');

const filteredLogs = computed(() => {
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

	return result;
});

const duration = computed(() => {
	if (!run.value) return '—';

	if (run.value.duration) {
		return formatDurationMs(run.value.duration);
	}

	const start = new Date(run.value.date_created).getTime();
	const end = run.value.finished_at ? new Date(run.value.finished_at).getTime() : Date.now();

	return formatDurationMs(end - start);
});

function formatDurationMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;

	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes === 0) return `${seconds}s`;
	return `${minutes}m ${remainingSeconds}s`;
}

function formatLogTime(timestamp: string): string {
	return format(new Date(timestamp), 'HH:mm:ss');
}

async function loadProject(projectId: string) {
	try {
		const data = await sdk.request(readDeploymentDashboard(props.provider));
		project.value = data.projects.find((p: any) => p.id === projectId) || null;
	} catch {
		project.value = null;
	}
}

async function loadRun(useSince = false) {
	try {
		const params: Record<string, any> = {
			// Cache-buster to prevent cached responses during polling
			_t: Date.now(),
		};

		if (useSince && lastLogTimestamp.value) {
			params.since = lastLogTimestamp.value;
		}

		const data = (await sdk.request(readDeploymentRun(props.provider, props.runId, params))) as RunDetails;

		run.value = data;

		// Append or replace logs
		if (data.logs && data.logs.length > 0) {
			if (useSince) {
				// Append new logs
				logs.value = [...logs.value, ...data.logs];
			} else {
				// Replace all logs
				logs.value = data.logs;
			}

			// Update last timestamp for next poll (add 1ms to get logs AFTER this one)
			const lastLog = data.logs[data.logs.length - 1];

			if (lastLog) {
				const lastTime = new Date(lastLog.timestamp);
				lastTime.setMilliseconds(lastTime.getMilliseconds() + 1);
				lastLogTimestamp.value = lastTime.toISOString();
			}

			// Auto-scroll to bottom
			nextTick(() => {
				if (logsContainer.value) {
					logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
				}
			});
		}
	} catch (error) {
		// Only show error on initial load, not during polling (to avoid spam)
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
	}
}

function downloadLogs() {
	if (logs.value.length === 0) return;

	const content = logs.value
		.map((log) => `[${formatLogTime(log.timestamp)}] [${log.type.toUpperCase()}] ${log.message}`)
		.join('\n');

	const blob = new Blob([content], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `deployment-logs-${run.value?.external_id || props.runId}.txt`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function openDeployment() {
	if (run.value?.url) {
		window.open(run.value.url, '_blank');
	}
}

function startPolling() {
	if (pollTimer) return;

	pollTimer = setInterval(() => {
		if (isBuilding.value) {
			loadRun(true);
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
	await Promise.all([loadRun(), loadProject(props.projectId)]);

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
			<VBreadcrumb
				:items="[
					{ name: $t(`deployment_provider_${provider}`), to: `/deployment/${provider}` },
				]"
			/>
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
			<VButton v-tooltip.bottom="$t('deployment_run_download_logs')" rounded icon secondary @click="downloadLogs">
				<VIcon name="download" />
			</VButton>

			<VButton
				v-if="run?.url"
				v-tooltip.bottom="$t('deployment_run_open_deployment')"
				rounded
				icon
				secondary
				@click="openDeployment"
			>
				<VIcon name="open_in_new" />
			</VButton>

			<VMenu v-if="isBuilding" placement="bottom-end" show-arrow>
				<template #activator="{ toggle }">
					<VButton rounded icon secondary @click="toggle">
						<VIcon name="more_vert" />
					</VButton>
				</template>

				<VList>
					<VListItem clickable :disabled="canceling" @click="cancel">
						<VListItemIcon><VIcon name="cancel" /></VListItemIcon>
						<VListItemContent>{{ $t('deployment_run_cancel') }}</VListItemContent>
					</VListItem>
				</VList>
			</VMenu>
		</template>

		<div v-if="loading" class="loading">
			<VProgressCircular indeterminate />
		</div>

		<div v-else class="content">
			<!-- Stats bar -->
			<div class="stats-bar">
				<div class="stat-card deployment-id">
					<VIcon name="assignment" class="stat-icon" />
					<span class="stat-label">{{ $t('deployment_run_id') }}</span>
					<div class="stat-value monospace">
						<VTextOverflow :text="run?.name || run?.external_id" placement="bottom" />
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
					<DeploymentStatus :status="run?.status" />
				</div>

				<div class="stat-card">
					<VIcon name="assignment" class="stat-icon" />
					<span class="stat-label">{{ $t('deployment_target') }}</span>
					<span class="stat-value">{{ run?.target }}</span>
				</div>
			</div>

			<!-- Log filters -->
			<div class="log-filters">
				<div class="filter-field">
					<VSelect v-model="logLevelFilter" :items="logLevelOptions" inline />
				</div>
				<div class="filter-field">
					<VIcon class="filter-icon" small name="search" />
					<input
						v-model="searchQuery"
						:placeholder="$t('deployment_run_search_logs')"
						class="search-input"
					/>
				</div>
			</div>

			<!-- Logs -->
			<div ref="logsContainer" class="logs-container">
				<div v-if="filteredLogs.length === 0" class="no-logs">
					{{ $t('deployment_run_no_logs') }}
				</div>

				<div v-else class="logs">
					<div v-for="(log, index) in filteredLogs" :key="index" :class="['log-entry', log.type]">
						<span class="log-time">[{{ formatLogTime(log.timestamp) }}]</span>
						<span class="log-type">[{{ log.type.toUpperCase() }}]</span>
						<span class="log-message">{{ log.message }}</span>
					</div>
				</div>
			</div>
		</div>
	</PrivateView>
</template>

<style scoped lang="scss">
.back-button {
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color-active: var(--theme--foreground);
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 200px;
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
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
	padding: 16px;
	min-height: 400px;
	max-height: calc(100vh - 400px);
	overflow-y: auto;
}

.no-logs {
	color: var(--theme--foreground-subdued);
	text-align: center;
	padding: 48px;
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
</style>
