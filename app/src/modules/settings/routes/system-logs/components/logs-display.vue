<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { upperFirst } from 'lodash';
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

async function scrollToIndex(index: number) {
	scroller.value.scrollToItem(index);
}

async function scrollToBottom() {
	scroller.value.scrollToBottom();
}
</script>

<template>
	<dynamic-scroller ref="scroller" :items="logs" key-field="id" :min-item-size="30" class="logs-display">
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
				<div :class="['log-entry', { expanded: item.expanded }]" @click="emit('expandLog', item.id)">
					<div class="log-overview">
						<v-icon v-if="item.expanded" name="expand_more" />
						<v-icon v-else name="chevron_right" />
						<span class="timestamp">
							{{ localizedFormat(item.data.time, `${t('date-fns_time_24hour')}`) }}
						</span>
						<v-chip small class="instance">{{ instances.indexOf(item.instance) + 1 }}</v-chip>
						<span class="message">{{ item.data.msg }}</span>
						<div class="labels">
							<v-chip small class="log-level">
								{{ upperFirst(Object.entries(props.logLevels).find(([_, val]) => val === item.data.level)?.[0]) }}
							</v-chip>
						</div>
					</div>
					<div v-if="item.expanded" class="raw-log">
						<pre>{{ JSON.stringify(item.data, null, '\t') }}</pre>
					</div>
				</div>
			</dynamic-scroller-item>
		</template>
	</dynamic-scroller>
</template>

<style lang="scss" scoped>
.logs-display {
	min-height: 300px;
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	transition: var(--fast) var(--transition);
	transition-property: border-color, box-shadow;
	box-shadow: var(--theme--form--field--input--box-shadow);
	overflow-y: scroll;
}

.log-entry {
	padding: 4px;
	min-height: 30px;
	cursor: pointer;
	display: flex;
	flex-direction: column;
	justify-content: center;
	--v-chip-background-color: var(--theme--primary);
}

.log-entry:hover {
	background-color: var(--theme--background-normal);
}

.log-overview {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%; /* Or specify a fixed width if needed */
}

.timestamp {
	flex-shrink: 0;
	color: var(--theme--foreground-subdued);
}

.message {
	flex-grow: 1;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	margin-right: 10px; /* Optional: space between text and button */
}

.expanded {
	background-color: var(--theme--background-normal);
}

.raw-log {
	margin: 4px;
	background-color: var(--theme--background);
	padding: 20px;
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	transition: var(--fast) var(--transition);
	transition-property: border-color, box-shadow;
	box-shadow: var(--theme--form--field--input--box-shadow);
	overflow-x: scroll;
}

.labels {
	flex-shrink: 0;
}

.log-level {
	--v-chip-background-color: var(--theme--primary);
}

.instance {
	--v-chip-background-color: var(--theme--background-accent);
}

.v-chip {
	margin-left: 6px;
	margin-right: 6px;
}
</style>
