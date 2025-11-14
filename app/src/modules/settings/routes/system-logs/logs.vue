<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { useShortcut } from '@/composables/use-shortcut';
import { getRootPath } from '@/utils/get-root-path';
import { sdk } from '@/sdk';
import { useServerStore } from '@/stores/server';
import { realtime } from '@directus/sdk';
import { useLocalStorage } from '@vueuse/core';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
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
const codemirrorEl = ref<HTMLTextAreaElement>();
let codemirror: CodeMirror.Editor | null = null;
const { isCopySupported, copyToClipboard } = useClipboard();
const search = ref<string>();
const logLevelNames = ref<string[]>();
const nodeIds = ref<string[]>();
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
let autoScroll = true;
const logsCount = ref(0);
const purgedLogsCount = ref(0);
const softWrap = useLocalStorage('system-logs-soft-wrap', true);

const client = sdk.with(
	realtime({
		authMode: 'strict',
		url: `${sdk.url.protocol === 'https:' ? 'wss' : 'ws'}://${sdk.url.host}${getRootPath()}websocket/logs`,
		reconnect: reconnectionParams,
	}),
);

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
			log.notice === true ||
			(logLevelValues.value.includes(log.data.level) &&
				nodeIds.value &&
				nodeIds.value.includes(log.instance) &&
				JSON.stringify(log)
					.toLowerCase()
					.includes(search.value?.toLowerCase() || ''))
		);
	});
});

watch([logLevelNames, nodeIds, search], () => {
	isFilterOptionsUpdated = true;
	minimizeLog();
	logsDisplay.value?.scrollToBottom();
});

watch(filteredLogs, (cur, prev) => {
	if (autoScroll) return;

	if (isFilterOptionsUpdated) {
		isFilterOptionsUpdated = false;
		logsDisplay.value?.clearUnreadLogs();
	} else {
		logsDisplay.value?.incrementUnreadLogs(cur.length - prev.length);
	}
});

watch(logDetailSearch, () => {
	processRawLog();
});

watch(logDetailVisible, async () => {
	await nextTick();
	codemirror?.refresh();
});

watch(softWrap, () => {
	codemirror?.setOption('lineWrapping', softWrap.value);
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

client.onWebSocket('open', () => {
	reconnectionCount = 0;

	client.sendMessage({ type: 'subscribe', log_level: maxLogLevelName.value });
});

client.onWebSocket('message', function (message) {
	const { type, data, uid, event } = message;

	if (type == 'logs') {
		if (event === 'subscribe') {
			streamConnected.value = true;
			addNotice(t('logs_session_resumed'));
		}

		if (data) {
			addLog({ index: logsCount.value, instance: uid, data, notice: false });

			if (!instances.value.includes(uid)) {
				if (!nodeIds.value) {
					nodeIds.value = [];
				}

				if (nodeIds.value.length === instances.value.length) {
					nodeIds.value.push(uid);
				}

				instances.value.push(uid);
			}
		}
	}
});

client.onWebSocket('close', function () {
	if (streamConnected.value) {
		addNotice(t('logs_stream_disconnected'));
	}

	streamConnected.value = false;
});

client.onWebSocket('error', function (_error) {
	streamConnected.value = false;

	reconnectionCount++;

	if (reconnectionCount >= reconnectionParams.retries) {
		shouldStream.value = false;
	}
});

function addLog(log: Log) {
	logs.value.push(log);

	if (logs.value.length > maxLogs) {
		logs.value.splice(0, 1);
		purgedLogsCount.value++;
		logDetailIndex.value--;
	}

	logsCount.value++;
}

function addNotice(msg: string) {
	addLog({
		index: logsCount.value,
		instance: '',
		data: { level: 10, msg, time: new Date().getTime() },
		notice: true,
	});
}

async function resumeLogsStreaming() {
	shouldStream.value = true;
	reconnectionCount = -1;

	try {
		await client.connect();
	} catch {
		// Error processed in the websocket error event
	}
}

function pauseLogsStreaming() {
	shouldStream.value = false;
	streamConnected.value = false;
	client.disconnect();
	addNotice(t('logs_session_paused'));
}

function showLogDetail(index: number) {
	autoScroll = false;

	const correctedIndex = index - purgedLogsCount.value;

	if (logs.value[correctedIndex]) {
		if (selectedLog.value) {
			selectedLog.value.selected = false;
		}

		logDetailIndex.value = correctedIndex;
		selectedLog.value = logs.value[correctedIndex];
		selectedLog.value.selected = true;
	}

	if (!codemirror && codemirrorEl.value) {
		codemirror = CodeMirror(codemirrorEl.value, {
			mode: 'application/json',
			readOnly: true,
			lineNumbers: true,
			lineWrapping: softWrap.value,
			cursorBlinkRate: -1,
		});
	}

	processRawLog();

	logDetailVisible.value = true;

	updateCopyButtonPosition();
}

function updateCopyButtonPosition() {
	const copyButtonEl: HTMLElement | null = document.querySelector('.copy-button');
	const codeMirrorScrollBarEl: HTMLElement | null = document.querySelector('.CodeMirror-hscrollbar');

	if (!copyButtonEl || !codeMirrorScrollBarEl) return;

	copyButtonEl.style.insetInlineEnd = `${Number(codeMirrorScrollBarEl.style.insetInlineEnd.replace('px', '')) + 10}px`;
}

function processRawLog() {
	let filteredRawLog = '';

	if (logDetailSearch.value && selectedLog.value) {
		const paths = logDetailSearch.value.split(',').map((p) => p.trim());
		const result = filterObjectBySortedPaths(selectedLog.value.data, paths);
		filteredRawLog = JSON.stringify(result, null, 2);
	} else {
		filteredRawLog = JSON.stringify(selectedLog.value?.data, null, 2);
	}

	codemirror?.setValue(filteredRawLog);
}

function minimizeLog() {
	logDetailVisible.value = false;

	if (selectedLog.value) {
		selectedLog.value.selected = false;
	}

	selectedLog.value = undefined;
}

function clearLogs() {
	logs.value.length = 0;
	logsCount.value = 0;
	autoScroll = true;
	logsDisplay.value?.clearUnreadLogs();
	minimizeLog();
}

function onScroll(event: Event) {
	const scroller = event.target as HTMLElement;

	const isNearBottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 10;

	if (isNearBottom) {
		autoScroll = true;
		logsDisplay.value?.clearUnreadLogs();
	} else {
		autoScroll = false;
	}
}

function onScrollBottom() {
	autoScroll = true;
	logsDisplay.value?.clearUnreadLogs();
}

function handleUpDownKey(isUp: boolean) {
	let filteredIndex;

	if (!selectedLog.value) {
		// None selected, scroll from the appropriate end
		if (isUp) {
			logsDisplay.value?.scrollToBottom();
			filteredIndex = filteredLogs.value.length - 1;
		} else {
			logsDisplay.value?.scrollToTop();
			filteredIndex = 0;
		}
	} else {
		filteredIndex = filteredLogs.value.findIndex((log) => log.index === selectedLog.value?.index);

		if (isUp && filteredIndex > 0) {
			filteredIndex--;
			logsDisplay.value?.scrollUpByOne();
		} else if (!isUp && filteredIndex < filteredLogs.value.length - 1) {
			filteredIndex++;
			logsDisplay.value?.scrollDownByOne();
		} else {
			return;
		}
	}

	const index = filteredLogs.value[filteredIndex]?.index;

	if (index !== undefined) {
		showLogDetail(index);
	}
}

useShortcut('arrowup', () => handleUpDownKey(true));
useShortcut('arrowdown', () => handleUpDownKey(false));

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
	<private-view :title="$t('settings_system_logs')">
		<template #headline><v-breadcrumb :items="[{ name: $t('settings'), to: '/settings' }]" /></template>
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded icon exact disabled>
				<v-icon name="terminal" />
			</v-button>
		</template>

		<template #actions>
			<v-button v-if="shouldStream && !streamConnected" v-tooltip.bottom="$t('loading')" rounded icon disabled>
				<v-progress-circular small indeterminate />
			</v-button>
			<v-button
				v-else-if="!shouldStream"
				v-tooltip.bottom="$t('resume_streaming_logs')"
				rounded
				icon
				@click="resumeLogsStreaming"
			>
				<v-icon name="play_arrow" />
			</v-button>
			<v-button v-else v-tooltip.bottom="$t('pause_streaming_logs')" rounded icon @click="pauseLogsStreaming">
				<v-icon name="pause" />
			</v-button>
			<v-button
				v-tooltip.bottom="$t('clear_logs')"
				rounded
				icon
				:disabled="logs.length === 0"
				class="action-clear"
				@click="clearLogs"
			>
				<v-icon name="mop" />
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
						:stream-connected="streamConnected"
						@log-selected="showLogDetail"
						@scroll="onScroll"
						@scrolled-to-bottom="onScrollBottom"
					/>
				</div>
				<transition name="fade">
					<div v-show="logDetailVisible" class="log-detail">
						<div class="log-detail-controls">
							<v-button class="close-button" x-large secondary icon @click="minimizeLog">
								<v-icon name="close" />
							</v-button>
							<interface-input
								:value="logDetailSearch"
								class="full"
								:placeholder="$t('log_detail_filter_paths')"
								icon-right="search"
								spellcheck="false"
								@input="logDetailSearch = $event"
							/>
						</div>
						<div ref="codemirrorEl" class="raw-log">
							<v-button
								v-if="isCopySupported"
								class="copy-button"
								secondary
								icon
								@click="copyToClipboard(codemirror?.getValue())"
							>
								<v-icon name="content_copy" />
							</v-button>
						</div>
						<div class="actions">
							<v-checkbox v-model="softWrap" :label="$t('soft_wrap_lines')" />
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
	--v-button-background-color: var(--theme--background-normal);
	--v-button-color: var(--theme--foreground);
	--v-button-background-color-hover: var(--theme--danger);
	--v-button-color-hover: var(--white);
}

.logs-container {
	inline-size: 100%;
	block-size: calc(100% - 110px);
	min-block-size: 600px;
	padding: var(--content-padding);
	padding-block-start: 0;
}

.filter {
	margin-block: 24px 20px;
}

.v-form {
	padding-block-end: var(--content-padding);
}

.split-view {
	display: flex;
	flex-direction: column;
	block-size: calc(100% - 50px);
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
	block-size: 50%;
}

.logs-display {
	flex: 2;
	min-block-size: 200px;
}

.log-detail {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 6px;
	min-block-size: 300px;
	background-color: var(--theme--background-subdued);
	border-block-start: var(--theme--border-width) solid
		var(--v-input-border-color, var(--theme--form--field--input--border-color));
	box-shadow: var(--sidebar-shadow);
	z-index: 1;
}

.log-detail-controls {
	display: flex;
	padding: 5px;
}

.close-button {
	margin-inline-end: 10px;
}

.copy-button {
	float: inline-end;
	position: absolute;
	inset-block-start: 10px;
	inset-inline-end: 10px;
	z-index: 2;
}

.raw-log {
	block-size: 100%;
	min-block-size: 100px;
	margin: 4px;
	position: relative;
	overflow: auto;
	background-color: var(--theme--background);
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground-accent);
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	box-shadow: var(--theme--form--field--input--box-shadow);
}

.raw-log :deep(.CodeMirror) {
	block-size: 100%;
	max-block-size: 100%;
}

.raw-log :deep(.CodeMirror-scroll) {
	block-size: 100%;
	max-block-size: 100%;
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--fast) var(--transition);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.actions {
	padding: 0 9px;
	margin-inline-start: auto;
}

@media (min-width: 960px) {
	.logs-container {
		margin-block-end: 0;
	}
}

@media (min-width: 1200px) {
	.split-view {
		flex-direction: row;
	}

	.split-view > div {
		block-size: 100%;
	}

	.logs-display {
		flex: 1;
	}

	.log-detail {
		flex: 1;
		max-inline-size: 50%;
		border-block-start: none;
		border-inline-start: var(--theme--border-width) solid
			var(--v-input-border-color, var(--theme--form--field--input--border-color));
	}
}
</style>
