<script setup lang="ts">
import { useShortcut } from '@/composables/use-shortcut';
import LogDetailFilteringInput from '@/interfaces/input/input.vue';
import { sdk } from '@/sdk';
import { useServerStore } from '@/stores/server';
import { realtime } from '@directus/sdk';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import InlineFilter from './components/inline-filter.vue';
import LogsDisplay from './components/logs-display.vue';
import SystemLogsSidebarDetail from './components/system-logs-sidebar-detail.vue';
import { Log } from './types';

const { t } = useI18n();
const reconnectionParams = { delay: 1000, retries: 10 };
let reconnectionCount = 0;
const logsDisplay = ref<InstanceType<typeof LogsDisplay>>();

const search = ref<string>();
const logLevelNames = ref<string[]>();
const nodeIds = ref<string[]>();

const client = sdk.with(
	realtime({ authMode: 'strict', url: `ws://${sdk.url.host}/websocket/logs`, reconnect: reconnectionParams }),
);

const logs = ref<Log[]>([]);
const serverStore = useServerStore();
let allowedLogLevels: Record<string, number> = {};
const allowedLogLevelNames: string[] = [];
const instances = ref<string[]>([]);
const maxLogLevelName = ref('');
let isFilterOptionsUpdated = false;
const shouldStream = ref(false);
const streamConnected = ref(false);
const maxLogs = 10_000;
const logDetailSearch = ref('');
const logDetailVisible = ref(false);
const logDetailIndex = ref(-1);
const selectedLog = ref<Log>();
const autoScroll = ref(true);
const logsCount = ref(0);
const purgedLogsCount = ref(0);
const unreadLogsCount = ref(0);

if (serverStore.info?.websocket) {
	if (serverStore.info.websocket.logs) {
		allowedLogLevels = serverStore.info.websocket.logs.allowedLogLevels;

		for (const [logLevelName] of Object.entries(serverStore.info.websocket.logs.allowedLogLevels)) {
			if (!maxLogLevelName.value) {
				maxLogLevelName.value = logLevelName;
			}

			allowedLogLevelNames.push(logLevelName);
			(logLevelNames.value || (logLevelNames.value = [])).push(logLevelName);
		}
	}
}

const logLevelValues = computed(() =>
	logLevelNames.value
		? logLevelNames.value.map((level) => allowedLogLevels[level]).filter((level) => level !== undefined)
		: [],
);

const filteredLogs = computed(() => {
	return logs.value.filter((log) => {
		return (
			logLevelValues.value.includes(log.data.level) &&
			nodeIds.value &&
			nodeIds.value.includes(log.instance) &&
			JSON.stringify(log)
				.toLowerCase()
				.includes(search.value?.toLowerCase() || '')
		);
	});
});

watch([logLevelNames, nodeIds, search], () => {
	isFilterOptionsUpdated = true;
	scrollLogsToBottom();
});

watch(filteredLogs, (cur, prev) => {
	if (autoScroll.value) return;

	if (isFilterOptionsUpdated) {
		unreadLogsCount.value = 0;
		isFilterOptionsUpdated = false;
	} else {
		unreadLogsCount.value += cur.length - prev.length;
	}
});

function filterObjectBySortedPaths(obj: Log['data'], paths: string[]) {
	function _filter(obj: Log['data'], paths: string[][]) {
		if (!obj || typeof obj !== 'object') return;

		const filtered: Record<string, any> = {};

		for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
			const currentSegment = paths[pathIndex]![0];
			const remainingSegments = paths[pathIndex]!.slice(1);
			const nestedPaths: string[][] = [];

			if (!currentSegment) continue;

			if (remainingSegments.length === 0) {
				// Skip paths that are nested
				if (pathIndex + 1 <= paths.length) {
					for (let nextPathIndex = pathIndex + 1; nextPathIndex < paths.length; nextPathIndex++) {
						if (paths[nextPathIndex]![0] === currentSegment) {
							pathIndex++;
						}
					}
				}

				if (obj[currentSegment] !== undefined) {
					filtered[currentSegment] = obj[currentSegment];
				}
			} else {
				nestedPaths.push(remainingSegments);

				// Skip paths that are nested
				if (pathIndex + 1 <= paths.length) {
					for (let nextPathIndex = pathIndex + 1; nextPathIndex < paths.length; nextPathIndex++) {
						const nextPath = paths[nextPathIndex];

						if (nextPath && nextPath[0] === currentSegment) {
							pathIndex++;
							nestedPaths.push(nextPath.slice(1));
						}
					}
				}

				if (Array.isArray(obj[currentSegment])) {
					filtered[currentSegment] = [];

					for (const child of obj[currentSegment]) {
						const result = _filter(child, nestedPaths);

						if (result && Object.keys(result).length > 0) {
							filtered[currentSegment].push(result);
						}
					}
				} else {
					filtered[currentSegment] = _filter(obj[currentSegment], nestedPaths);
				}
			}
		}

		return filtered;
	}

	return _filter(
		obj,
		Array.from(new Set(paths))
			.sort()
			.map((path) => path.trim().split('.')),
	);
}

const filteredRawLog = computed(() => {
	if (logDetailSearch.value && selectedLog.value) {
		const paths = logDetailSearch.value.split(',').map((p) => p.trim());
		const result = filterObjectBySortedPaths(selectedLog.value.data, paths);
		return JSON.stringify(result, null, 2) || 'No match found';
	} else {
		return JSON.stringify(selectedLog.value?.data, null, 2);
	}
});

client.onWebSocket('open', () => {
	reconnectionCount = 0;

	client.sendMessage({ type: 'subscribe', log_level: maxLogLevelName.value });
});

client.onWebSocket('message', function (message) {
	const { type, data, uid, event } = message;

	if (type == 'logs') {
		if (event === 'subscribe') {
			streamConnected.value = true;
		}

		if (data) {
			logs.value.push({ index: logsCount.value, instance: uid, data });

			if (!instances.value.includes(uid)) {
				if (!nodeIds.value) {
					nodeIds.value = [];
				}

				if (nodeIds.value.length === instances.value.length) {
					nodeIds.value.push(uid);
				}

				instances.value.push(uid);
			}

			if (logs.value.length > maxLogs) {
				logs.value.splice(0, 1);
				purgedLogsCount.value++;
				logDetailIndex.value--;
			}

			if (autoScroll.value) {
				scrollLogsToBottom();
			}

			logsCount.value++;
		}
	}
});

client.onWebSocket('close', function () {
	streamConnected.value = false;
});

client.onWebSocket('error', function (_error) {
	streamConnected.value = false;

	reconnectionCount++;

	if (reconnectionCount >= reconnectionParams.retries) {
		shouldStream.value = false;
	}
});

async function resumeLogsStreaming() {
	shouldStream.value = true;
	reconnectionCount = -1;

	try {
		await client.connect();
	} catch {
		// Error processed in the websocket error event
	}
}

async function pauseLogsStreaming() {
	shouldStream.value = false;
	client.disconnect();
}

async function maximizeLog(index: number) {
	const correctedIndex = index - purgedLogsCount.value;

	if (logs.value[correctedIndex]) {
		if (selectedLog.value) {
			selectedLog.value.selected = false;
		}

		logDetailIndex.value = correctedIndex;
		selectedLog.value = logs.value[correctedIndex];
		selectedLog.value.selected = true;
	}

	logDetailVisible.value = true;
}

async function minimizeLog() {
	logDetailVisible.value = false;

	if (selectedLog.value) {
		selectedLog.value.selected = false;
	}
}

function clearLogs() {
	logs.value.length = 0;
	logsCount.value = 0;
}

function scrollLogsToBottom() {
	logsDisplay.value?.scrollToBottom();
}

async function onScroll(event: Event) {
	const scroller = event.target as HTMLElement;

	if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1) {
		autoScroll.value = true;
		scrollLogsToBottom();
	} else {
		autoScroll.value = false;
	}
}

useShortcut('escape', () => {
	minimizeLog();
});

onMounted(() => {
	resumeLogsStreaming();
});

onUnmounted(() => {
	pauseLogsStreaming();
});
</script>

<template>
	<private-view :title="t('settings_system_logs')">
		<template #headline><v-breadcrumb :items="[{ name: t('settings'), to: '/settings' }]" /></template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="terminal" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-if="shouldStream && !streamConnected" v-tooltip.bottom="t('loading')" rounded icon disabled>
				<v-progress-circular small indeterminate />
			</v-button>
			<v-button
				v-else-if="!shouldStream"
				v-tooltip.bottom="t('resume_streaming_logs')"
				rounded
				icon
				@click="resumeLogsStreaming"
			>
				<v-icon name="play_arrow" />
			</v-button>
			<v-button v-else v-tooltip.bottom="t('pause_streaming_logs')" rounded icon @click="pauseLogsStreaming">
				<v-icon name="pause" />
			</v-button>
			<v-button
				v-tooltip.bottom="t('clear_logs')"
				rounded
				icon
				:disabled="logs.length === 0"
				class="action-clear"
				@click="clearLogs"
			>
				<v-icon name="delete" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="logs-container">
			<InlineFilter
				v-model:type="logLevelNames"
				v-model:sort="nodeIds"
				v-model:search="search"
				:allowed-log-level-names="allowedLogLevelNames"
				:instances="instances"
				class="filter"
			/>
			<div class="split-view">
				<div class="logs-display">
					<logs-display
						ref="logsDisplay"
						:logs="filteredLogs"
						:log-levels="allowedLogLevels"
						:instances="instances"
						:unread-logs-count="unreadLogsCount"
						@expand-log="maximizeLog"
						@scroll="onScroll"
						@scrolled-to-bottom="unreadLogsCount = 0"
					/>
				</div>
				<transition name="fade">
					<div v-if="logDetailVisible" class="log-detail">
						<div class="log-detail-controls">
							<v-button class="close-button" large secondary icon @click="minimizeLog">
								<v-icon name="close" />
							</v-button>
							<log-detail-filtering-input
								:value="logDetailSearch"
								class="full"
								placeholder="Filter Paths (eg: req.method, res.statusCode)"
								icon-right="search"
								@input="logDetailSearch = $event"
							/>
						</div>
						<div class="raw-log">
							<pre>{{ filteredRawLog || 'No Log Selected' }}</pre>
						</div>
					</div>
				</transition>
			</div>
		</div>

		<template #sidebar>
			<system-logs-sidebar-detail />
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.action-clear {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--theme--danger);
}

.logs-container {
	width: 100%;
	height: calc(100% - 110px);
	min-height: 800px;
	padding: var(--content-padding);
	padding-top: 0;
}

.filter {
	margin-block-start: 24px;
	margin-block-end: 20px;
}

.v-form {
	padding-bottom: var(--content-padding);
}

.split-view {
	display: flex;
	flex-direction: column;
	height: calc(100% - 50px);
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	transition: var(--fast) var(--transition);
	transition-property: border-color, box-shadow;
	box-shadow: var(--theme--form--field--input--box-shadow);
	overflow: hidden;
}

.split-view > div {
	box-sizing: border-box;
	height: 50%;
}

.logs-display {
	flex: 2;
	min-height: 300px;
}

.log-detail {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 6px;
	min-height: 400px;
	background-color: var(--theme--background-subdued);
	border-top: var(--theme--border-width) solid
		var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	box-shadow: var(--sidebar-shadow);
}

.log-detail-controls {
	display: flex;
	padding: 5px;
}

.close-button {
	margin-right: 10px;
}

.raw-log {
	height: 100%;
	margin: 4px;
	padding: 20px;
	overflow: auto;
	background-color: var(--theme--background);
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground-accent);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	box-shadow: var(--theme--form--field--input--box-shadow);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--fast) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

@media (min-width: 960px) {
	.logs-container {
		margin-bottom: 0;
	}

	.log-detail {
		border-left: var(--theme--border-width) solid
			var(--v-input-border-color, var(--theme--form--field--input--border-color));
	}
}

@media (min-width: 1200px) {
	.split-view {
		flex-direction: row;
	}

	.split-view > div {
		height: 100%;
	}

	.logs-display {
		flex: 1;
	}

	.log-detail {
		flex: 1;
		max-width: 50%;
	}
}
</style>
