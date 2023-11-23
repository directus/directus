<script setup lang="ts">
withDefaults(
	defineProps<{
		value: number | null;
		disabled?: boolean;
		minValue?: number;
		maxValue?: number;
		stepInterval?: number;
		alwaysShowValue?: boolean;
	}>(),
	{
		minValue: 0,
		maxValue: 100,
		stepInterval: 1,
	},
);

defineEmits(['input']);
</script>

<template>
	<v-slider
		:model-value="value"
		:disabled="disabled"
		:min="minValue"
		:max="maxValue"
		:step="stepInterval"
		:always-show-value="alwaysShowValue"
		show-thumb-label
		show-ticks
		@update:model-value="$emit('input', $event)"
	/>
</template>

<style lang="scss" scoped>
.v-slider {
	margin-top: 12px;
}
</style>
