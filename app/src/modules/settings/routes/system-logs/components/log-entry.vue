<script setup lang="ts">
import { ref } from 'vue';
import { Log } from '../types';
import { upperFirst } from 'lodash';

interface Props {
	log: Log;
	logLevels: Record<string, number>;
}

const props = withDefaults(defineProps<Props>(), {});
const expanded = ref(false);
const rawData = JSON.stringify(props.log.data, null, '\t');
const logLevelLabel = upperFirst(Object.entries(props.logLevels).find(([_, val]) => val === props.log.data.level)?.[0]);
</script>

<template>
	<div :class="['log-entry', { expanded }]" @click="expanded = !expanded">
		<span class="log-overview">
			<v-icon v-if="expanded" name="expand_more" />
			<v-icon v-else name="chevron_right" />
			<v-chip small>{{ logLevelLabel }}</v-chip>
			{{ props.log.uid }}: {{ props.log.data.msg }}
		</span>
		<div v-if="expanded" class="raw-log">
			<pre>{{ rawData }}</pre>
		</div>
	</div>
</template>

<style>
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
	height: 100%;
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
</style>
