import { withKnobs, color, optionsKnob as options, number, text, boolean } from '@storybook/addon-knobs';

import Vue from 'vue';
import VProgressCircular from './v-progress-circular.vue';
import markdown from './readme.md';
import withPadding from '../../../../.storybook/decorators/with-padding';

Vue.component('v-progress-circular', VProgressCircular);

export default {
	title: 'Components / Progress (circular)',
	component: VProgressCircular,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const interactive = () => ({
	props: {
		value: {
			default: number('Value', 60),
		},
		indeterminate: {
			default: boolean('Indeterminate', false),
		},
		color: {
			default: color('Color', '#263238'),
		},
		backgroundColor: {
			default: color('Background Color', '#cfd8dc'),
		},
		size: {
			default: options(
				'Size',
				{
					'Extra Small': 'xSmall',
					Small: 'small',
					'(default)': 'default',
					Large: 'large',
					'Extra Large': 'xLarge',
				},
				'default',
				{
					display: 'select',
				}
			),
		},
		speed: {
			default: text('Speed (css, eg 200ms)', '2s'),
		},
		customSize: {
			default: text('Size (in px)', ''),
		},
		customLineSize: {
			default: text('Line Size (in px)', ''),
		},
	},
	template: `
	<v-progress-circular
		:value="value"
		:indeterminate="indeterminate"
		:style="{
			'--v-progress-circular-color': color,
			'--v-progress-circular-background-color': backgroundColor,
			'--v-progress-circular-speed': speed,
			'--v-progress-circular-size': customSize,
			'--v-progress-circular-line-size': customLineSize
		}"
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
	/>`,
});

export const colors = () => `
<div style="display: flex; justify-content: space-around">
	<v-progress-circular value="80" style="--v-progress-circular-color: var(--red)" />
	<v-progress-circular value="15" style="--v-progress-circular-color: var(--blue)" />
	<v-progress-circular indeterminate style="--v-progress-circular-color: var(--green)" />
	<v-progress-circular value="45" style="--v-progress-circular-color: var(--amber); --v-progress-circular-background-color: var(--red)" />
	<v-progress-circular value="65" style="--v-progress-circular-color: var(--purple)" />
</div>
`;

export const sizes = () => `
<div style="display: flex; justify-content: space-around">
<v-progress-circular value="45" x-small />
<v-progress-circular value="45" small />
<v-progress-circular value="45" />
<v-progress-circular value="45" large />
<v-progress-circular value="45" x-large />
</div>
`;

export const speed = () => `
<div style="display: flex; justify-content: space-around">
<v-progress-circular indeterminate style="--v-progress-circular-speed: 5s" />
<v-progress-circular indeterminate style="--v-progress-circular-speed: 2.5s" />
<v-progress-circular indeterminate />
<v-progress-circular indeterminate style="--v-progress-circular-speed: 1.5s" />
<v-progress-circular indeterminate style="--v-progress-circular-speed: 1.25s" />
</div>
`;

export const withSlot = () => `
<div style="display: flex; gap: 20px;">
	<v-progress-circular value="60" large>
		60%
	</v-progress-circular>
	<v-progress-circular value="60" large>
		<v-icon name="add"/>
	</v-progress-circular>
</div>
`;
