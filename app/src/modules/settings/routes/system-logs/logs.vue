<script setup lang="ts">
import { sdk } from '@/sdk';
import { useServerStore } from '@/stores/server';
import SearchInput from '@/views/private/components/search-input.vue';
import { LOG_LEVEL, LOG_LEVELS } from '@directus/constants';
import { realtime } from '@directus/sdk';
import { isValidLogLevel } from '@directus/utils';
import { upperFirst } from 'lodash';
import { computed, nextTick, ref, Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import LogsDisplay from './components/logs-display.vue';
import SystemLogsSidebarDetail from './components/system-logs-sidebar-detail.vue';
import { Log } from './types';

const { t } = useI18n();
const logsDisplay = ref<InstanceType<typeof LogsDisplay>>();
const client = sdk.with(realtime({ authMode: 'strict', url: `ws://${sdk.url.host}/websocket/logs` }));
const logs = ref<Log[]>([]);
const serverStore = useServerStore();
const allowedLogLevels: { label: string; value: LOG_LEVEL }[] = [];
const search = ref<string | null>('');
const maxLogLevelName = ref('');
const activeFilterLevels: Ref<Set<LOG_LEVEL>> = ref(new Set());
const streamStarted = ref(false);
const maxLogs = 10_000;

if (serverStore.info?.websocket) {
	if (serverStore.info.websocket.logs) {
		for (const logLevel of serverStore.info.websocket.logs.allowedLogLevels) {
			if (!isValidLogLevel(logLevel)) continue;

			if (!maxLogLevelName.value) {
				maxLogLevelName.value = logLevel;
			}

			const logLevelValue = LOG_LEVELS[logLevel];

			allowedLogLevels.push({
				label: upperFirst(logLevel),
				value: logLevelValue,
			});

			activeFilterLevels.value.add(logLevelValue);
		}
	}
}

const filteredLogs = computed(() => {
	return logs.value.filter((log) => {
		return (
			activeFilterLevels.value.has(log.data.level) && JSON.stringify(log).includes(search.value?.toLowerCase() || '')
		);
	});
});

watch([search, activeFilterLevels.value], async () => {
	await nextTick();
	logsDisplay.value?.scrollToBottom();
});

const toggleLogLevel = (logLevel: LOG_LEVEL) => {
	if (activeFilterLevels.value.has(logLevel)) {
		activeFilterLevels.value.delete(logLevel);
	} else {
		activeFilterLevels.value.add(logLevel);
	}
};

client.onWebSocket('open', () => {
	client.sendMessage({ type: 'subscribe', log_level: maxLogLevelName.value });
});

client.onWebSocket('message', function (message) {
	const { type, data, uid } = message;

	if (type == 'logs' && data) {
		logs.value.push({ uid, data });

		if (logs.value.length > maxLogs) logs.value.splice(0, 1);
	}
});

client.onWebSocket('close', function () {
	streamStarted.value = false;
});

client.onWebSocket('error', function (_error) {
	streamStarted.value = false;
});

async function startLogsStreaming() {
	streamStarted.value = true;

	await client.connect();
}

async function stopLogsStreaming() {
	streamStarted.value = false;

	client.disconnect();
}

function clearLogs() {
	logs.value.length = 0;
}
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
			<search-input v-model="search" :placeholder="t('search_logs')" :show-filter="false" />

			<v-button
				v-if="!streamStarted"
				v-tooltip.bottom="t('start_streaming_logs')"
				rounded
				icon
				@click="startLogsStreaming"
			>
				<v-icon name="play_arrow" />
			</v-button>
			<v-button v-else v-tooltip.bottom="t('stop_streaming_logs')" rounded icon @click="stopLogsStreaming">
				<v-icon name="stop" />
			</v-button>
			<v-button
				v-tooltip.bottom="t('clear_logs')"
				rounded
				icon
				:disabled="logs.length === 0"
				class="action-delete"
				@click="clearLogs"
			>
				<v-icon name="delete" />
			</v-button>
		</template>

		<template #navigation>
			<settings-navigation />
		</template>

		<div class="logs-container">
			<div class="controls">
				<v-chip
					v-for="logLevel in allowedLogLevels"
					:key="logLevel.value"
					:outlined="!activeFilterLevels.has(logLevel.value)"
					large
					class="log-level-chip clickable"
					@click="toggleLogLevel(logLevel.value)"
				>
					{{ logLevel.label }}
				</v-chip>
			</div>
			<logs-display ref="logsDisplay" :logs="filteredLogs" class="logs-display" />
		</div>

		<template #sidebar>
			<system-logs-sidebar-detail />
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
.controls {
	display: flex;
	padding-bottom: var(--content-padding);
	width: 100%;
}

.log-level-chip {
	margin-right: 8px;
	--v-chip-background-color: var(--theme--background-normal);
}

.logs-container {
	padding: var(--content-padding);
	position: relative;
	width: 100%;
	height: calc(100% - 110px);
	min-height: 400px;
	padding-bottom: var(--content-padding-bottom);
}

.center {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}

.logs-display {
	width: 100%;
	height: calc(100% - 60px);
}

.header-icon {
	--v-button-background-color-disabled: var(--theme--primary-background);
	--v-button-color-disabled: var(--theme--primary);
	--v-button-background-color-hover-disabled: var(--theme--primary-subdued);
	--v-button-color-hover-disabled: var(--theme--primary);
}

.action-delete {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--theme--danger);
}
</style>
