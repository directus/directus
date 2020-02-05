import {
	withKnobs,
	text,
	boolean,
	number,
	color,
	optionsKnob as options
} from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VSheet from './v-sheet.vue';
import VIcon from '../v-icon/';
import markdown from './v-sheet.readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-sheet', VSheet);

export default {
	title: 'Components / Sheet',
	component: VSheet,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const interactive = () => ({
	props: {
		text: {
			default: text(
				'Text',
				'A sheet is component holds other components. It provides an extra visual layer on the page.'
			)
		},
		color: {
			default: color('Color', '#cfd8dc')
		},
		width: {
			default: number('Width', 0)
		},
		height: {
			default: number('Height', 0)
		},
		minWidth: {
			default: number('Min Width', 0)
		},
		minHeight: {
			default: number('Min Height', 0)
		},
		maxWidth: {
			default: number('Max Width', 0)
		},
		maxHeight: {
			default: number('Max Height', 0)
		}
	},
	template: `
	<v-sheet
		:color="color"
		:width="width"
		:height="height"
		:minWidth="minWidth"
		:minHeight="minHeight"
		:maxWidth="maxWidth"
		:maxHeight="maxHeight"
	>{{ text }}</v-sheet>`
});

export const colorsSizes = () => `
<div>
<v-sheet
	color="#ef9a9a"
	:width="150"
	:height="150"
/>

<v-sheet
	color="#81D4FA"
	:width="550"
	:height="50"
/>

<v-sheet
	color="#E6EE9C"
	:width="220"
	:height="500"
/>
</div>
`;
