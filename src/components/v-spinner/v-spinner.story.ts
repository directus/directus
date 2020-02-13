import { withKnobs, color, optionsKnob as options, number, text } from '@storybook/addon-knobs';

import Vue from 'vue';
import VSpinner from './v-spinner.vue';
import markdown from './v-spinner.readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-spinner', VSpinner);

export default {
	title: 'Components / Spinner',
	component: VSpinner,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const interactive = () => ({
	props: {
		color: {
			default: color('Color', '#263238')
		},
		backgroundColor: {
			default: color('Background Color', '#cfd8dc')
		},
		size: {
			default: options(
				'Size',
				{
					'Extra Small': 'xSmall',
					Small: 'small',
					'(default)': 'default',
					Large: 'large',
					'Extra Large': 'xLarge'
				},
				'default',
				{
					display: 'select'
				}
			)
		},
		speed: {
			default: text('Speed (css, eg 200ms)', '1s')
		},
		customSize: {
			default: text('Size (in px)', '28px')
		},
		customLineSize: {
			default: text('Line Size (in px)', '3px')
		}
	},
	template: `
	<v-spinner
		:style="{
			'--v-spinner-color': color,
			'--v-spinner-background-color': backgroundColor,
			'--v-spinner-speed': speed,
			'--v-spinner-size': customSize,
			'--v-spinner-line-size': customLineSize
		}"
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
	/>`
});

export const colors = () => `
<div style="display: flex; justify-content: space-around">
	<v-spinner style="--v-spinner-color: var(--red)" />
	<v-spinner style="--v-spinner-color: transparent; --v-spinner-background-color: var(--blue)" />
	<v-spinner style="--v-spinner-color: var(--green)" />
	<v-spinner style="--v-spinner-color: var(--amber); --v-spinner-background-color: var(--red)" />
	<v-spinner style="--v-spinner-color: var(--purple)" />
</div>
`;

export const sizes = () => `
<div style="display: flex; justify-content: space-around">
<v-spinner x-small />
<v-spinner small />
<v-spinner  />
<v-spinner large />
<v-spinner x-large />
</div>
`;

export const speed = () => `
<div style="display: flex; justify-content: space-around">
<v-spinner style="--v-spinner-speed: 5s" />
<v-spinner style="--v-spinner-speed: 2.5s" />
<v-spinner  />
<v-spinner style="--v-spinner-speed: 500ms" />
<v-spinner style="--v-spinner-speed: 250ms" />
</div>
`;
