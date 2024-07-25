<script setup lang="ts">
import { sdk } from '@/sdk';
import { useServerStore } from '@/stores/server';
import SearchInput from '@/views/private/components/search-input.vue';
import { realtime } from '@directus/sdk';
import { upperFirst } from 'lodash';
import { nanoid } from 'nanoid';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SettingsNavigation from '../../components/navigation.vue';
import LogsDisplay from './components/logs-display.vue';
import SystemLogsSidebarDetail from './components/system-logs-sidebar-detail.vue';
import { Log } from './types';

type LogsFilter = {
	logLevelNames: string[] | null;
	logLevelValues: number[];
	nodeIds: string[] | null;
	search: string;
};

const { t } = useI18n();
const logsDisplay = ref<InstanceType<typeof LogsDisplay>>();
const client = sdk.with(realtime({ authMode: 'strict', url: `ws://${sdk.url.host}/websocket/logs` }));
const logs = ref<Log[]>([]);
const serverStore = useServerStore();
let allowedLogLevels: Record<string, number> = {};
const allowedLogLevelNames: string[] = [];
const instances = ref<string[]>([]);
const maxLogLevelName = ref('');
const activeInstances = ref<string[]>([]);
const filterOptions = ref<LogsFilter>({ logLevelNames: [], logLevelValues: [], nodeIds: [], search: '' });
const streamStarted = ref(false);
const maxLogs = 10_000;

if (serverStore.info?.websocket) {
	if (serverStore.info.websocket.logs) {
		allowedLogLevels = serverStore.info.websocket.logs.allowedLogLevels;

		for (const [logLevelName, logLevelValue] of Object.entries(serverStore.info.websocket.logs.allowedLogLevels)) {
			if (!maxLogLevelName.value) {
				maxLogLevelName.value = logLevelName;
			}

			allowedLogLevelNames.push(logLevelName);
			(filterOptions.value.logLevelNames || (filterOptions.value.logLevelNames = [])).push(logLevelName);
			filterOptions.value.logLevelValues.push(logLevelValue);
		}
	}
}

const filterOptionsUpdated = ({ logLevelNames, nodeIds }: LogsFilter) => {
	if (logLevelNames) {
		if (logLevelNames?.length === 0) {
			filterOptions.value.logLevelNames = null;
		}

		filterOptions.value.logLevelValues = logLevelNames
			.map((level) => allowedLogLevels[level])
			.filter((level) => level !== undefined);
	}

	if (nodeIds) {
		if (nodeIds.length === 0) {
			filterOptions.value.nodeIds = null;
		}

		activeInstances.value = nodeIds;
	}
};

const filteredLogs = computed(() => {
	return logs.value.filter((log) => {
		return (
			filterOptions.value.logLevelValues.includes(log.data.level) &&
			(!filterOptions.value.nodeIds || filterOptions.value.nodeIds.includes(log.instance)) &&
			JSON.stringify(log).toLowerCase().includes(filterOptions.value.search.toLowerCase())
		);
	});
});

const fields = computed(() => {
	return [
		{
			field: 'logLevelNames',
			name: 'Log Level',
			type: 'string',
			meta: {
				interface: 'select-multiple-dropdown',
				options: {
					choices: allowedLogLevelNames
						? allowedLogLevelNames.map((logLevel) => ({
								text: upperFirst(logLevel),
								value: logLevel,
						  }))
						: [],
					allowNone: true,
				},
				width: 'half',
			},
		},
		{
			field: 'nodeIds',
			name: 'Instance',
			type: 'string',
			meta: {
				interface: 'select-multiple-dropdown',
				options: {
					choices: instances.value.map((nodeId, index) => ({
						text: `${index + 1} (${nodeId})`,
						value: nodeId,
					})),
					allowNone: true,
				},
				width: 'half',
			},
		},
	];
});

watch([filterOptions.value], async () => {
	await nextTick();
	logsDisplay.value?.scrollToBottom();
});

client.onWebSocket('open', () => {
	client.sendMessage({ type: 'subscribe', log_level: maxLogLevelName.value });
});

client.onWebSocket('message', function (message) {
	const { type, data, uid } = message;

	if (type == 'logs' && data) {
		logs.value.push({ id: nanoid(), instance: uid, data });

		if (!instances.value.includes(uid)) {
			if (filterOptions.value.nodeIds?.length === instances.value.length) {
				filterOptions.value.nodeIds.push(uid);
			}

			instances.value.push(uid);
		}

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
			<search-input v-model="filterOptions.search" :placeholder="t('search_logs')" :show-filter="false" />

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
			<v-form v-model="filterOptions" :fields="fields" @update:model-value="filterOptionsUpdated"></v-form>
			<logs-display
				ref="logsDisplay"
				:logs="filteredLogs"
				:log-levels="allowedLogLevels"
				:instances="instances"
				class="logs-display"
			/>
		</div>

		<template #sidebar>
			<system-logs-sidebar-detail />
		</template>
	</private-view>
</template>

<style lang="scss" scoped>
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

.v-form {
	padding-bottom: var(--content-padding);
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

.action-clear {
	--v-button-background-color: var(--danger-10);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-25);
	--v-button-color-hover: var(--theme--danger);
}
</style>
