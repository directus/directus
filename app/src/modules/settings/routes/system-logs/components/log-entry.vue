<script setup lang="ts">
import { localizedFormat } from '@/utils/localized-format';
import { upperFirst } from 'lodash';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Log } from '../types';

interface Props {
	log: Log;
	logLevels: Record<string, number>;
	instances: string[];
}

const props = withDefaults(defineProps<Props>(), {});
const expanded = ref(false);
const rawData = JSON.stringify(props.log.data, null, '\t');
const logLevelLabel = upperFirst(Object.entries(props.logLevels).find(([_, val]) => val === props.log.data.level)?.[0]);
const { t } = useI18n();
</script>

<template>
	<div :class="['log-entry', { expanded }]" @click="expanded = !expanded">
		<div class="log-overview">
			<v-icon v-if="expanded" name="expand_more" />
			<v-icon v-else name="chevron_right" />
			<span class="timestamp">
				{{ localizedFormat(props.log.data.time, `${t('date-fns_date')} ${t('date-fns_time_24hour')}`) }}
			</span>
			<span class="message">{{ props.log.data.msg }}</span>
			<div class="labels">
				<v-chip small>{{ instances.indexOf(props.log.instance) + 1 }}</v-chip>
				<v-chip small>{{ logLevelLabel }}</v-chip>
			</div>
		</div>
		<div v-if="expanded" class="raw-log">
			<pre>{{ rawData }}</pre>
		</div>
	</div>
</template>

<style lang="scss" scoped>
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
	margin-right: 6px;
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

.v-chip {
	margin-left: 6px;
}
</style>
