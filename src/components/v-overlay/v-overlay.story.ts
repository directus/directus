import {
	withKnobs,
	text,
	boolean,
	number,
	optionsKnob as options,
	color
} from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VOverlay from '../v-overlay';
import markdown from './v-overlay.readme.md';

Vue.component('v-overlay', VOverlay);

export default {
	title: 'Components / Overlay',
	component: VOverlay,
	decorators: [withKnobs],
	parameters: {
		notes: markdown
	}
};

export const interactive = () => ({
	props: {
		absolute: {
			default: boolean('Absolute', false)
		},
		color: {
			default: color('Color', '#263238')
		},
		zIndex: {
			default: number('z-index', 500)
		},
		opacity: {
			default: number('Opacity', 0.75)
		}
	},
	data() {
		return {
			active: false
		};
	},
	template: `
	<div style="position: relative; padding: 50px; border: 3px dashed #eee; width: max-content;">
		<v-button @click="active = true">Show overlay</v-button>

		<v-overlay :active="active" :absolute="absolute" :color="color" :z-index="zIndex" :opacity="opacity">
		<v-button @click="active = false">Close overlay</v-button>
		</v-overlay>
	</div>
	`
});

export const withClick = () => ({
	props: {
		absolute: {
			default: boolean('Absolute', false)
		},
		color: {
			default: color('Color', '#263238')
		},
		zIndex: {
			default: number('z-index', 500)
		},
		opacity: {
			default: number('Opacity', 0.75)
		}
	},
	data() {
		return {
			active: false
		};
	},
	methods: {
		click(event: MouseEvent) {
			action('click')(event);
			const self: any = this;
			self.active = false;
		}
	},
	template: `
	<div style="position: relative; padding: 50px; border: 3px dashed #eee; width: max-content;">
		<v-button @click="active = true">Show overlay</v-button>

		<v-overlay :active="active" :absolute="absolute" :color="color" :z-index="zIndex" :opacity="opacity" @click="click" />
	</div>
	`
});
