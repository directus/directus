<template>
	<div class="color-dot">
		<value-null v-if="value === null && defaultColor === null" />
		<div class="dot" :style="styles"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import Color from 'color';
import { isHex } from '@/utils/is-hex';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		defaultColor: {
			type: String,
			default: '#B0BEC5',
			validator: (value: string) => value === null || isHex(value) || value.startsWith('var(--'),
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			return props.value;
		});

		const styles = computed(() => {
			const defaultColor = props.defaultColor?.startsWith('var(') ? getVar(props.defaultColor) : props.defaultColor;
			const value = props.value?.startsWith('var(') ? getVar(props.value) : props.value;

			const style: Record<string, any> = { 'background-color': defaultColor };

			if (value !== null) style['background-color'] = value;

			const pageColorString = getVar('var(--background-page)');

			const pageColorRGB = Color(pageColorString);
			const colorRGB = value === null ? Color(defaultColor) : Color(value);

			if (colorRGB.contrast(pageColorRGB) < 1.1) style['border'] = '1px solid var(--border-normal)';

			return style;
		});

		return { displayValue, styles };

		function getVar(cssVar: string) {
			return getComputedStyle(document.body).getPropertyValue(cssVar.slice(4, -1)).trim();
		}
	},
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
