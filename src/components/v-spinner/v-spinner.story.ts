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
			default: number('Size (in px)', 0)
		},
		customLineSize: {
			default: number('Line Size (in px)', 0)
		}
	},
	template: `
	<v-spinner
		:color="color"
		:background-color="backgroundColor"
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
		:size="customSize"
		:line-size="customLineSize"
		:speed="speed"
	/>`
});

export const colors = () => `
<div style="display: flex; justify-content: space-around">
<v-spinner color="--red" />
<v-spinner color="transparent" background-color="--blue" />
<v-spinner color="--green" />
<v-spinner color="--amber" background-color="--red" />
<v-spinner color="--purple" />
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
<v-spinner speed="5s" />
<v-spinner speed="2.5s" />
<v-spinner  />
<v-spinner speed="500ms" />
<v-spinner speed="250ms" />
</div>
`;
