<template>
	<div class="color-dot">
		<value-null v-if="value === null" />
		<div class="dot" :style="styles"></div>
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from '@vue/composition-api';
import formatTitle from '@directus/format-title';
import Color from 'color';
import colorString from 'color-string';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		defaultColor: {
			type: String,
			default: '#B0BEC5',
			validator: (value: string) => colorString.get.rgb(value) !== null,
		},
	},
	setup(props) {
		const displayValue = computed(() => {
			return props.value;
		});

		const styles = computed(() => {
			const style: Record<string, any> = { 'background-color': props.defaultColor };

			if (Color(props.value) !== undefined) style['background-color'] = props.value;

			const pageColorString = getComputedStyle(document.body).getPropertyValue('--background-page');

			const pageColorRGB = colorString.get.rgb(pageColorString) || colorString.get.rgb('#FFF');
			const colorRGB = colorString.get.rgb(props.value) || colorString.get.rgb(props.defaultColor);

			if (pageColorRGB == null || colorRGB == null) return {};

			if (Color.rgb(...colorRGB.slice(0.3)).contrast(Color.rgb(...pageColorRGB.slice(0, 3))) < 3)
				style['border'] = '1px solid var(--border-normal-alt)';

			return style;
		});

		return { displayValue, styles };
	},
});
</script>

<style lang="scss" scoped>
.color-dot {
	display: flex;
	align-items: center;

	.dot {
		display: inline-block;
		flex-shrink: 0;
		width: 12px;
		height: 12px;
		margin: 0 4px;
		border-radius: 6px;
	}
}
</style>
