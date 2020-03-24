import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VOverlay from '../v-overlay';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-overlay', VOverlay);

export default {
	title: 'Components / Overlay',
	component: VOverlay,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const interactive = () => ({
	props: {
		absolute: {
			default: boolean('Absolute', false),
		},
		color: {
			default: text('Color', 'rgba(38, 50, 56, 0.75)'),
		},
		zIndex: {
			default: number('z-index', 500),
		},
	},
	data() {
		return {
			active: false,
		};
	},
	template: `
	<div style="position: relative; padding: 50px; border: 3px dashed #eee; width: max-content;">
		<v-button @click="active = true">Show overlay</v-button>

		<v-overlay :active="active" :absolute="absolute" :style="{'--v-overlay-color': color, '--v-overlay-z-index': zIndex }">
		<v-button @click="active = false">Close overlay</v-button>
		</v-overlay>
	</div>
	`,
});

export const withClick = () => ({
	props: {
		absolute: {
			default: boolean('Absolute', false),
		},
		color: {
			default: text('Color', 'rgba(38, 50, 56, 0.75)'),
		},
		zIndex: {
			default: number('z-index', 500),
		},
	},
	data() {
		return {
			active: false,
		};
	},
	methods: {
		click(event: MouseEvent) {
			action('click')(event);
			(this as any).active = false;
		},
	},
	template: `
	<div style="position: relative; padding: 50px; border: 3px dashed #eee; width: max-content;">
		<v-button @click="active = true">Show overlay</v-button>

		<v-overlay
		:style="{
			'--v-overlay-color': color,
			'--v-overlay-z-index': zIndex,
		}"
		:active="active"
		:absolute="absolute"
		@click="click" />
	</div>
	`,
});
