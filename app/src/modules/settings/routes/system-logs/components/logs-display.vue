<script setup lang="ts">
import { useVirtualList } from '@vueuse/core';
import { Log } from '../types';
import { computed } from 'vue';
import LogEntry from './log-entry.vue';
import { nextTick } from 'vue';

interface Props {
	logs: Log[];
}

const props = defineProps<Props>();

const logs = computed(() => {
	return props.logs;
});

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(logs, {
	itemHeight: 30,
	overscan: 30,
});

async function scrollToIndex(index: number) {
	scrollTo(index);
}

async function scrollToBottom() {
	await nextTick();
	scrollToIndex(logs.value.length);
}

defineExpose({ scrollToIndex, scrollToBottom });
</script>

<template>
	<div v-bind="containerProps" class="log-container">
		<div v-bind="wrapperProps">
			<log-entry v-for="{ index, data } in list" :key="index" :log="data" />
		</div>
	</div>
</template>

<style>
.log-container {
	min-height: 300px;
	overflow-y: auto;
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	transition: var(--fast) var(--transition);
	transition-property: border-color, box-shadow;
	box-shadow: var(--theme--form--field--input--box-shadow);
}
</style>
