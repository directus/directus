<template>
	<div class="color-dot">
		<value-null v-if="value === null && defaultColor === null" />
		<div class="dot" :style="styles"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import formatTitle from '@directus/format-title';
import Color from 'color';
import { isHex } from '@/utils/color';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		defaultColor: {
			type: String,
			default: '#B0BEC5',
			validator: (value: string) => value === null || isHex(value),
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			return props.value;
		});

		const styles = computed(() => {
			const style: Record<string, any> = { 'background-color': props.defaultColor };

			if (props.value !== null) style['background-color'] = props.value;

			const pageColorString = getComputedStyle(document.body).getPropertyValue('--background-page').trim();

			const pageColorRGB = Color(pageColorString);
			const colorRGB = props.value === null ? Color(props.defaultColor) : Color(props.value);

			if (colorRGB.contrast(pageColorRGB) < 1.5) style['border'] = '1px solid var(--border-normal-alt)';

			return style;
		});

		return { displayValue, styles };
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
		width: 12px;
		height: 12px;
		border-radius: 6px;
	}
}
</style>
