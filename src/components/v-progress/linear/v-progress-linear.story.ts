import { withKnobs, color, number, boolean } from '@storybook/addon-knobs';

import Vue from 'vue';
import VProgressLinear from './v-progress-linear.vue';
import markdown from './readme.md';
import withPadding from '../../../../.storybook/decorators/with-padding';

Vue.component('v-progress-linear', VProgressLinear);

export default {
	title: 'Components / Progress (linear)',
	component: VProgressLinear,
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
		backgroundColor: {
			default: color('Background Color', '#cfd8dc'),
		},
		bottom: {
			default: boolean('Bottom', false),
		},
		color: {
			default: color('Color', '#263238'),
		},
		fixed: {
			default: boolean('Fixed', false),
		},
		height: {
			default: number('Height', 4),
		},
		indeterminate: {
			default: boolean('Indeterminate', false),
		},
		rounded: {
			default: boolean('Rounded', false),
		},
		top: {
			default: boolean('Top', false),
		},
		value: {
			default: number('Value (percentage)', 50),
		},
	},
	template: `
	<v-progress-linear
		:absolute="absolute"
		:style="{
			'--v-progress-linear-color': color,
			'--v-progress-linear-background-color': backgroundColor
		}"
		:bottom="bottom"
		:fixed="fixed"
		:height="height"
		:indeterminate="indeterminate"
		:rounded="rounded"
		:top="top"
		:value="value"
	/>`,
});

export const withSlot = () => `
<v-progress-linear :style="{ '--v-progress-linear-height': '25px' }" :value="25" rounded>25%</v-progress-linear>
`;
