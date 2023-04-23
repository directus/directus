<template>
	<div class="color-dot">
		<value-null v-if="value === null && defaultColor === null" />
		<div class="dot" :style="styles"></div>
	</div>
</template>

<script setup lang="ts">
import { isHex } from '@/utils/is-hex';
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

const styles = computed(() => {
	const defaultColor = props.defaultColor?.startsWith('var(')
		? cssVar(props.defaultColor.slice(4, -1))
		: props.defaultColor;

	const value = props.value?.startsWith('var(') ? cssVar(props.value.slice(4, -1)) : props.value;

	const style: Record<string, any> = { 'background-color': defaultColor };

	if (value !== null) style['background-color'] = value;

	const pageColorString = cssVar('--background-page');

	const pageColorRGB = Color(pageColorString);
	const colorRGB = value === null ? Color(defaultColor) : Color(value);

	if (colorRGB.contrast(pageColorRGB) < 1.1) style['border'] = '1px solid var(--border-normal)';

	return style;
});
</script>

<style lang="scss" scoped>
.color-dot {
	display: inline-flex;
	align-items: center;

	.dot {
		display: inline-block;
		flex-shrink: 0;
		width: 10px;
		height: 10px;
		border-radius: 5px;
	}
}
</style>
