import { withKnobs, text, color } from '@storybook/addon-knobs';
import Vue from 'vue';
import VSheet from './v-sheet.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-sheet', VSheet);

export default {
	title: 'Components / Sheet',
	component: VSheet,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const interactive = () => ({
	props: {
		text: {
			default: text(
				'Text',
				'A sheet is component holds other components. It provides an extra visual layer on the page.'
			),
		},
		color: {
			default: color('Color', '#f9fafa'),
		},
		width: {
			default: text('Width', 'auto'),
		},
		height: {
			default: text('Height', 'auto'),
		},
		minWidth: {
			default: text('Min Width', 'none'),
		},
		minHeight: {
			default: text('Min Height', 'var(--input-height)'),
		},
		maxWidth: {
			default: text('Max Width', 'none'),
		},
		maxHeight: {
			default: text('Max Height', 'none'),
		},
		padding: {
			default: text('Padding', '8px'),
		},
	},
	template: `
	<v-sheet
		:style="{
			'--v-sheet-background-color': color,
			'--v-sheet-width': width,
			'--v-sheet-height': height,
			'--v-sheet-min-width': minWidth,
			'--v-sheet-min-height': minHeight,
			'--v-sheet-max-width': maxWidth,
			'--v-sheet-max-height': maxHeight,
			'--v-sheet-padding': padding
		}"
	>{{ text }}</v-sheet>`,
});

export const colorsSizes = () => `
<div>
<v-sheet
	style="
		--v-sheet-background-color: #ef9a9a;
		--v-sheet-width: 150px;
		--v-sheet-height: 150px;
		margin-bottom: 20px;
	"
	:width="150"
	:height="150"
/>

<v-sheet
	style="
		--v-sheet-background-color: #81D4FA;
		--v-sheet-width: 550px;
		--v-sheet-height: 50px;
		margin-bottom: 20px;
	"
	:width="550"
	:height="50"
/>

<v-sheet
	style="
		--v-sheet-background-color: #E6EE9C;
		--v-sheet-width: 220px;
		--v-sheet-height: 500px;
	"
	:width="220"
	:height="500"
/>
</div>
`;
