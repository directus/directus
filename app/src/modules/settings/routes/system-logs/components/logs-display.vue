<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import { Log } from '../types';

interface Props {
	logs: Log[];
	logLevels: Record<string, number>;
	instances: string[];
}

const props = defineProps<Props>();
const emit = defineEmits(['expandLog']);

defineExpose({ scrollToIndex, scrollToBottom });

const { t } = useI18n();
const scroller = ref();

const logLevelMap = Object.entries(props.logLevels).reduce(
	(acc, [logLevelName, logLevelValue]) => {
		acc[logLevelValue] = logLevelName;
		return acc;
	},
	{} as Record<number, string>,
);

async function scrollToIndex(index: number) {
	scroller.value.scrollToItem(index);
}

async function scrollToBottom() {
	scroller.value.scrollToBottom();
}
</script>

<template>
	<dynamic-scroller ref="scroller" :items="logs" key-field="index" :min-item-size="30" class="logs-display" x>
		<template #before>
			<div class="notice">This is the beginning of your logs session...</div>
		</template>
		<template #after>
			<div class="notice">Awaiting for more logs...</div>
		</template>
		<template #default="{ item, index, active }">
			<dynamic-scroller-item
				:item="item"
				:active="active"
				:size-dependencies="[item.data.msg]"
				:data-index="index"
				:data-active="active"
			>
				<div :class="['log-entry', { expanded: item.selected }]" @click="emit('expandLog', item.index)">
					<span class="timestamp">[{{ localizedFormat(item.data.time, `${t('date-fns_time_24hour')}`) }}]</span>
					<span class="instance">[#{{ instances.indexOf(item.instance) + 1 }}]</span>
					<span :class="['log-level', logLevelMap[item.data.level]]">
						{{ logLevelMap[item.data.level]?.toLocaleUpperCase() }}
					</span>
					<span
						v-if="item.data.req?.method && item.data.req?.url && item.data.res?.statusCode && item.data.responseTime"
						class="message"
					>
						{{ item.data.req.method }} {{ item.data.req.url }} {{ item.data.res.statusCode }}
						{{ item.data.responseTime }}ms
					</span>
					<span v-else class="message">{{ item.data.msg }}</span>
				</div>
			</dynamic-scroller-item>
		</template>
	</dynamic-scroller>
</template>

<style lang="scss" scoped>
.notice {
	margin: 6px;
	padding-left: 6px;
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground-subdued);
}

.logs-display {
	min-height: 300px;
	height: 100%;
}

.log-entry:hover {
	background-color: var(--theme--background-normal);
}

.log-entry {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-family: var(--theme--fonts--monospace--font-family);
	color: var(--theme--foreground);
	padding: 6px;
}

.log-entry > span {
	padding: 0 6px 0 6px;
}

.message {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	flex-grow: 1;
}

.expanded {
	background-color: var(--theme--background-normal);
}

.log-level {
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
}

.info {
	color: var(--blue);
}

.warn {
	color: var(--yellow);
}

.error {
	color: var(--red);
}

.fatal {
	color: var(--red);
	background-color: var(--red-25);
}
</style>
