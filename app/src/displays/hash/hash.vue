<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		masked?: boolean;
	}>(),
	{
		value: null,
	},
);

const displayValue = computed(() => {
	if (props.masked) {
		return '**********';
	}

	return props.value;
});
</script>

<template>
	<value-null v-if="displayValue === null || displayValue === undefined" />

	<div v-else>{{ displayValue }}</div>
</template>
