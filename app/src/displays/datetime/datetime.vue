<template>
	<span class="datetime">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { useDatetime, type DatetimeType, type DatetimeOptions } from '@/composables/use-datetime';

interface Props extends DatetimeOptions {
	value: string;
	type: DatetimeType;
}

const props = defineProps<Props>();

const { formatter, refresher } = useDatetime(props.type, props);
const displayValue = formatter(props.value, refresher);
</script>

<style lang="scss" scoped>
.datetime {
	overflow: hidden;
	line-height: 1.15;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
