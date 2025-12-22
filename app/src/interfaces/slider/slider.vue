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
		class="directus-slider-fix"
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

<style lang="scss" scoped>
/**
 * Slider interaction fixes.
 */
.directus-slider-fix {
	cursor: pointer;

	:deep(.v-slider),
	:deep(.v-slider__container),
	:deep(.v-slider-track),
	:deep(.v-slider-track__background),
	:deep(.v-slider-track__fill) {
		cursor: pointer;
		transition: none;
	}

	/**
	 * Thumb interaction fixes.
	 */
	:deep(.v-slider-thumb) {
		cursor: pointer;
		transition: inset-inline-start 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: inset-inline-start;
	}

	/**
	 * Always-visible value label above thumb.
	 */
	:deep(.v-slider-thumb__label) {
		inset-block-start: -28px;
		background: var(--v-theme-primary);
		color: white;
		font-size: 12px;
		padding: 2px 6px;
		border-radius: 6px;
	}
}
</style>
