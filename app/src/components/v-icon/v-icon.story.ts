import { withKnobs, text, boolean, number, color, optionsKnob as options } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VIcon from '../v-icon/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Icon',
	component: VIcon,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const interactive = () => ({
	methods: { onClick: action('click') },
	props: {
		name: {
			default: text('Icon Name', 'person'),
		},
		color: {
			default: color('Color', '#37474f'),
		},
		outline: {
			default: boolean('Outline', false),
		},
		sup: {
			default: boolean('Superscript', false),
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
		customSize: {
			default: number('Size (in px)', 0),
		},
	},
	template: `
		<v-icon
			:name="name"
			:sup="sup"
			:style="{'--v-icon-color': color}"
			:x-small="size === 'xSmall'"
			:small="size === 'small'"
			:large="size === 'large'"
			:x-large="size === 'xLarge'"
			:size="customSize"
		/>
	`,
});

export const superscript = () =>
	`<span>Title<v-icon name="star" :style="{ '--v-icon-color': 'var(--blue)' }" sup /></span>`;

export const sizesAndColors = () => `
<div>
	<v-icon name="star" :style="{'--v-icon-color': 'var(--light-blue)'}" sup />
	<v-icon name="accessibility_new" :style="{'--v-icon-color': 'var(--red)'}" x-small />
	<v-icon name="warning" :style="{'--v-icon-color': 'var(--purple)'}" small />
	<v-icon name="gesture" :style="{'--v-icon-color': 'var(--blue)'}" />
	<v-icon name="security" :style="{'--v-icon-color': 'var(--green)'}" large />
	<v-icon name="person" :style="{'--v-icon-color': 'var(--orange)'}" x-large />
</div>
`;

export const withClickEvent = () => ({
	methods: {
		click: action('click'),
	},
	template: `
<v-icon name="star" @click="click" />
`,
});

export const leftRight = () => ({
	template: `
<div style="display: flex">
<v-button style="margin-right: 2rem;">
	<v-icon name="add" left /> Add
</v-button>
<v-button>
	Remove <v-icon name="remove" right />
</v-button>
</div>
`,
});
