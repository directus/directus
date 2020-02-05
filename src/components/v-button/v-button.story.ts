import { withKnobs, text, boolean, number, optionsKnob as options } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VButton from './v-button.vue';
import VIcon from '../v-icon/';
import markdown from './v-button.readme.md';

Vue.component('v-button', VButton);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Button',
	component: VButton,
	decorators: [withKnobs],
	parameters: {
		notes: markdown
	}
};

export const withText = () => ({
	methods: { onClick: action('click') },
	props: {
		text: {
			default: text('Text in button', 'Click me')
		},
		block: {
			default: boolean('Block', false, 'Button')
		},
		rounded: {
			default: boolean('Rounded', false, 'Button')
		},
		icon: {
			default: boolean('Icon mode', false, 'Button')
		},
		outlined: {
			default: boolean('Outlined', false, 'Button')
		},
		type: {
			default: text('Type attribute', 'button', 'Button')
		},
		loading: {
			default: boolean('Loading', false, 'Button')
		},
		width: {
			default: number('Width', 0, {}, 'Button')
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
				},
				'Button'
			)
		},
		disabled: {
			default: boolean('Disabled', false, 'Button')
		},
		color: {
			default: text('Color', '--button-primary-text-color', 'Colors')
		},
		backgroundColor: {
			default: text('Background Color', '--button-primary-background-color', 'Colors')
		},
		hoverColor: {
			default: text('Color (hover)', '--white', 'Colors')
		},
		hoverBackgroundColor: {
			default: text('Background Color (hover)', '--black', 'Colors')
		}
	},
	template: `
		<v-button
			:block="block"
			:rounded="rounded"
			:outlined="outlined"
			:icon="icon"
			:color="color"
			:background-color="backgroundColor"
			:hover-color="hoverColor"
			:hover-background-color="hoverBackgroundColor"
			:type="type"
			:disabled="disabled"
			:loading="loading"
			:width="width"
			:x-small="size === 'xSmall'"
			:small="size === 'small'"
			:large="size === 'large'"
			:x-large="size === 'xLarge'"
			@click="onClick"
		>
			{{ text }}
		</v-button>
	`
});

export const withIcon = () => ({
	methods: { onClick: action('click') },
	props: {
		iconName: {
			default: text('Material Icon', 'add')
		},
		block: {
			default: boolean('Block', false, 'Button')
		},
		rounded: {
			default: boolean('Rounded', true, 'Button')
		},
		icon: {
			default: boolean('Icon mode', true, 'Button')
		},
		outlined: {
			default: boolean('Outlined', false, 'Button')
		},
		type: {
			default: text('Type attribute', 'button', 'Button')
		},
		loading: {
			default: boolean('Loading', false, 'Button')
		},
		width: {
			default: number('Width', 0, {}, 'Button')
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
				},
				'Button'
			)
		},
		iconSize: {
			default: options(
				'Size (Icon)',
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
				},
				'Button'
			)
		},
		disabled: {
			default: boolean('Disabled', false, 'Button')
		},
		color: {
			default: text('Color', '--button-primary-text-color', 'Colors')
		},
		backgroundColor: {
			default: text('Background Color', '--button-primary-background-color', 'Colors')
		},
		hoverColor: {
			default: text('Color (hover)', '--white', 'Colors')
		},
		hoverBackgroundColor: {
			default: text('Background Color (hover)', '--black', 'Colors')
		}
	},
	template: `
		<v-button
			:block="block"
			:rounded="rounded"
			:outlined="outlined"
			:icon="icon"
			:color="color"
			:background-color="backgroundColor"
			:hover-color="hoverColor"
			:hover-background-color="hoverBackgroundColor"
			:type="type"
			:disabled="disabled"
			:loading="loading"
			:width="width"
			:x-small="size === 'xSmall'"
			:small="size === 'small'"
			:large="size === 'large'"
			:x-large="size === 'xLarge'"
			@click="onClick"
		>
			<v-icon
				:name="iconName"
				:x-small="iconSize === 'xSmall'"
				:small="iconSize === 'small'"
				:large="iconSize === 'large'"
				:x-large="iconSize === 'xLarge'"
			/>
		</v-button>
	`
});

export const sizes = () => `
<div>
	<v-button x-small>Extra small</v-button>
	<v-button small>Small</v-button>
	<v-button>Default</v-button>
	<v-button large>Large</v-button>
	<v-button x-large>Extra Large</v-button>
</div>
`;

export const colors = () => `
<div>
	<v-button
		color="--red"
		background-color="--red-50"
		hover-color="--white"
		hover-background-color="--red"
	>
		Delete
	</v-button>
	<v-button
		color="--white"
		background-color="--green"
		hover-background-color="--green-800"
	>
		Save
	</v-button>
	<v-button
		color="--white"
		background-color="--amber"
		hover-background-color="--amber-800"
	>
		Warn
	</v-button>
	<v-button
		color="--blue-grey-800"
		background-color="--blue-grey-50"
		hover-color="--red"
		hover-background-color="--white"
	>
		Hover
	</v-button>
	<v-button
		color="--blue-grey-800"
		background-color="transparent"
		hover-color="--black"
		hover-background-color="--blue-grey-100"
	>
		Transparent
	</v-button>
</div>
`;

export const customLoading = () => ({
	props: {
		loading: {
			default: boolean('Loading', true)
		}
	},
	template: `
	<v-button :loading="loading">
		Hello, World!
		<template #loading>
			..Loading..
		</template>
	</v-button>`
});
