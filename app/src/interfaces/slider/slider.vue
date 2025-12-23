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

/**
 * Default slider configuration.
 */
const props = withDefaults(defineProps<NumberProps | LegacyNumericStringProps>(), {
	minValue: 0,
	maxValue: 100,
	stepInterval: 1,
	alwaysShowValue: true,
});

/**
 * Normalize incoming values to a number.
 */
const value = computed<number | null>(() => {
	if (props.value === null) return null;
	if (props.type === 'decimal') return Number(props.value);
	if (props.type === 'bigInteger') return Number(props.value);
	return props.value;
});

defineEmits<{
	(e: 'input', value: number | null): void;
}>();
</script>

<template>
	<!--
		Custom wrapper class used to fix cursor behavior,
		thumb label visibility, and interaction smoothness.
	-->
	<VSlider
		:model-value="value"
		:min="minValue"
		:max="maxValue"
		:step="stepInterval"
		:disabled="disabled"
		:readonly="nonEditable"
		show-ticks
		show-thumb-label="always"
		@update:model-value="$emit('input', $event)"
	/>
</template>


