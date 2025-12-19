<script setup lang="ts">
import { isHex } from '@/utils/is-hex';
import ValueNull from '@/views/private/components/value-null.vue';
import { cssVar } from '@directus/utils/browser';
import Color from 'color';
import { computed } from 'vue';

const props = defineProps({
	value: {
		type: String,
		default: null,
	},
	defaultColor: {
		type: String,
		default: '#B0BEC5',
		validator: (value: string) => value === null || isHex(value) || value.startsWith('var(--'),
	},
});

const color = computed(() => props.value ?? props.defaultColor);

const addBorder = computed(() => {
	try {
		const valueColor = Color(color.value);
		const pageColor = Color(cssVar('--theme--background'));
		return valueColor.contrast(pageColor) < 1.1;
	} catch {
		// There's a chance the color isn't supported by color-js (like with color-mix or other modern
		// CSS), in which case we'll just show the dot as-is
		return false;
	}
});
</script>

<template>
	<div class="color-dot">
		<ValueNull v-if="value === null && defaultColor === null" />
		<div class="dot" :class="{ 'with-border': addBorder }" />
	</div>
</template>

<style lang="scss" scoped>
.color-dot {
	display: inline-flex;
	align-items: center;

	.dot {
		background-color: v-bind(color);
		display: inline-block;
		flex-shrink: 0;
		inline-size: 10px;
		block-size: 10px;
		border-radius: 5px;

		&.with-border {
			border: 1px solid var(--theme--form--field--input--border-color);
		}
	}
}
</style>
