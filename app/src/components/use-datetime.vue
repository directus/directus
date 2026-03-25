<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { formatDate, type FormatDateOptions } from '@/utils/format-date';

export interface Props extends FormatDateOptions {
	value: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
	format: 'long',
	relative: false,
	strict: false,
	round: 'round',
	suffix: true,
});

const displayValue = ref<string | null>(null);

watch(
	() => props.value,
	(newValue) => {
		displayValue.value = formatDate(newValue, props);
	},
	{ immediate: true },
);

let refreshInterval: number | null = null;

onMounted(() => {
	if (!props.relative) return;

	refreshInterval = window.setInterval(() => {
		displayValue.value = formatDate(props.value, props);
	}, 60_000);
});

onUnmounted(() => {
	if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<template>
	<slot :datetime="displayValue" />
</template>
