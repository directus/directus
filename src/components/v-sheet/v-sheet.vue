<template>
	<div class="v-sheet" :style="styles">
		<slot />
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';

export default createComponent({
	props: {
		color: {
			type: String,
			default: '--input-background-color-alt'
		},
		minHeight: {
			type: Number,
			default: null
		},
		maxHeight: {
			type: Number,
			default: null
		},
		height: {
			type: Number,
			default: null
		},
		minWidth: {
			type: Number,
			default: null
		},
		maxWidth: {
			type: Number,
			default: null
		},
		width: {
			type: Number,
			default: null
		}
	},
	setup(props) {
		type Styles = {
			'--_v-sheet-color': string;
			'--_v-sheet-min-height'?: string;
			'--_v-sheet-max-height'?: string;
			'--_v-sheet-height'?: string;
			'--_v-sheet-min-width'?: string;
			'--_v-sheet-max-width'?: string;
			'--_v-sheet-width'?: string;
		};

		const styles = computed(() => {
			const styles: Styles = {
				'--_v-sheet-color': parseCSSVar(props.color)
			};

			if (props.minHeight) {
				styles['--_v-sheet-min-height'] = props.minHeight + 'px';
			}

			if (props.maxHeight) {
				styles['--_v-sheet-max-height'] = props.maxHeight + 'px';
			}

			if (props.height) {
				styles['--_v-sheet-height'] = props.height + 'px';
			}

			if (props.minWidth) {
				styles['--_v-sheet-min-width'] = props.minWidth + 'px';
			}

			if (props.maxWidth) {
				styles['--_v-sheet-max-width'] = props.maxWidth + 'px';
			}

			if (props.width) {
				styles['--_v-sheet-width'] = props.width + 'px';
			}

			return styles;
		});

		return { styles };
	}
});
</script>

<style lang="scss" scoped>
.v-sheet {
	--_v-sheet-height: auto;
	--_v-sheet-min-height: var(--input-height);
	--_v-sheet-max-height: none;

	--_v-sheet-width: auto;
	--_v-sheet-min-width: none;
	--_v-sheet-max-width: none;

	padding: 8px;
	border-radius: var(--border-radius);
	background-color: var(--_v-sheet-color);

	height: var(--_v-sheet-height);
	min-height: var(--_v-sheet-min-height);
	max-height: var(--_v-sheet-max-height);
	width: var(--_v-sheet-width);
	min-width: var(--_v-sheet-min-width);
	max-width: var(--_v-sheet-max-width);

	overflow: auto;
}
</style>
