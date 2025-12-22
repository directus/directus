<script setup lang="ts">
import VSlider from '@/components/v-slider.vue';
import { computed } from 'vue';

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

defineEmits(['input']);
</script>

<template>
	<!--
		Custom wrapper class used to fix cursor behavior,
		thumb label visibility, and interaction smoothness.
	-->
	<v-slider
		class="directus-slider-fix"
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

<style lang="scss" scoped>
/**
 * Slider interaction fixes:
 */
.directus-slider-fix {
	cursor: pointer !important;

	:deep(.v-slider) {
		cursor: pointer !important;
	}

	:deep(.v-slider__container) {
		cursor: pointer !important;
	}

	:deep(.v-slider-track) {
		cursor: pointer !important;
	}

	:deep(.v-slider-track__background),
	:deep(.v-slider-track__fill) {
		cursor: pointer !important;
		transition: none !important;
	}

	/**
	 * Thumb interaction fixes:
	 */
	:deep(.v-slider-thumb) {
		cursor: pointer !important;
		transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1) !important;
		will-change: left;

		&:hover,
		&:active {
			cursor: pointer !important;
		}
	}

	
	:deep(.v-slider-thumb__label) {
		top: -28px;
		background: var(--v-theme-primary);
		color: white;
		font-size: 12px;
		padding: 2px 6px;
		border-radius: 6px;
	}

	/**
	 * Safety net to ensure no nested element
	 * triggers an unexpected cursor change.
	 */
	* {
		cursor: pointer !important;
	}
}
</style>
