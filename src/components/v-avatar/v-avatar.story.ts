import { withKnobs, text, boolean, number, color, optionsKnob as options } from '@storybook/addon-knobs';
import Vue from 'vue';
import VAvatar from './v-avatar.vue';
import VIcon from '../v-icon/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-avatar', VAvatar);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Avatar',
	component: VAvatar,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const withText = () => ({
	props: {
		text: {
			default: text('Text', 'RVZ'),
		},
		tile: {
			default: boolean('Tile', false),
		},
		color: {
			default: color('Color', '#009688'),
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
	<v-avatar
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
		:tile="tile"
		:style="{'--v-avatar-color': color }"
		:size="customSize"
	>{{ text }}</v-avatar>`,
});

export const withImage = () => ({
	props: {
		tile: {
			default: boolean('Tile', false),
		},
		color: {
			default: color('Color', '#009688'),
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
	<v-avatar
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
		:tile="tile"
		:style="{'--v-avatar-color': color }"
		:size="customSize"
	>
		<img src="https://randomuser.me/api/portraits/men/97.jpg" />
	</v-avatar>`,
});

export const withIcon = () => ({
	props: {
		tile: {
			default: boolean('Tile', false),
		},
		color: {
			default: color('Color', '#009688'),
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
	<v-avatar
		:x-small="size === 'xSmall'"
		:small="size === 'small'"
		:large="size === 'large'"
		:x-large="size === 'xLarge'"
		:tile="tile"
		:style="{'--v-avatar-color': color }"
		:size="customSize"
	>
		<v-icon name="person" :style="{'--v-icon-color': 'white'}" />
	</v-avatar>`,
});

export const sizes = () => ({
	template: `
	<div style="display: flex; justify-content: space-around; align-items: center;">
		<v-avatar x-small>
			<img src="https://randomuser.me/api/portraits/men/97.jpg" />
		</v-avatar>
		<v-avatar small>
			<img src="https://randomuser.me/api/portraits/men/97.jpg" />
		</v-avatar>
		<v-avatar>
			<img src="https://randomuser.me/api/portraits/men/97.jpg" />
		</v-avatar>
		<v-avatar large>
			<img src="https://randomuser.me/api/portraits/men/97.jpg" />
		</v-avatar>
		<v-avatar x-large>
			<img src="https://randomuser.me/api/portraits/men/97.jpg" />
		</v-avatar>
	</div>
	`,
});
