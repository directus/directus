<script setup lang="ts">
import { computed } from 'vue';
import VSlider from '@/components/v-slider.vue';

interface BaseProps {
	disabled?: boolean;
	nonEditable?: boolean;
	minValue?: number;
	maxValue?: number;
	stepInterval?: number;
	alwaysShowValue?: boolean;
}
interface NumberProps extends BaseProps {
	type: 'integer' | 'float';
	value: number | null;
}
interface LegacyNumericStringProps extends BaseProps {
	type: 'bigInteger' | 'decimal';
	value: string | null;
}

const props = withDefaults(defineProps<NumberProps | LegacyNumericStringProps>(), {
	minValue: 0,
	maxValue: 100,
	stepInterval: 1,
});

const value = computed(() => {
	if (props.type === 'decimal') return parseFloat(props.value as string);
	if (props.type === 'bigInteger') return parseInt(props.value as string);
	return props.value as number | null;
});

defineEmits(['input']);
</script>

<template>
	<VSlider
		:model-value="value"
		:disabled="disabled"
		:non-editable="nonEditable"
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
	margin-block-start: 12px;
}
</style>
