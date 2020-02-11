import { withKnobs, text, boolean, number, optionsKnob as options } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VChip from './v-chip.vue';
import VIcon from '../v-icon/';
import markdown from './v-chip.readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-chip', VChip);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Chip',
	component: VChip,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const withText = () => ({
	methods: { onClick: action('click'), onClose: action('close') },
	props: {
		text: {
			default: text('Text in chip', 'Click me')
		},
		label: {
			default: boolean('Label', false, 'Button')
		},
		outlined: {
			default: boolean('Outlined', false, 'Button')
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
		close: {
			default: boolean('Close', false, 'Button')
		},
		disabled: {
			default: boolean('Disabled', false, 'Button')
		},
		active: {
			default: boolean('Active', true, 'Button')
		},
		color: {
			default: text('Color', '--chip-primary-text-color', 'Colors')
		},
		backgroundColor: {
			default: text('Background Color', '--chip-primary-background-color', 'Colors')
		},
		hoverColor: {
			default: text('Color (hover)', '--chip-primary-text-color', 'Colors')
		},
		hoverBackgroundColor: {
			default: text(
				'Background Color (hover)',
				'--chip-primary-background-color-hover',
				'Colors'
			)
		}
	},
	template: `
		<v-chip
			:active.sync="active"
			:label="label"
			:outlined="outlined"
			:color="color"
			:close="close"
			:background-color="backgroundColor"
			:hover-color="hoverColor"
			:hover-background-color="hoverBackgroundColor"
			:disabled="disabled"
			:x-small="size === 'xSmall'"
			:small="size === 'small'"
			:large="size === 'large'"
			:x-large="size === 'xLarge'"
			@click="onClick"
			@close="onClose"
		>
			{{ text }}
		</v-chip>
	`
});

export const withIcon = () => ({
	methods: { onClick: action('click'), onClose: action('close') },
	props: {
		iconName: {
			default: text('Material Icon', 'add')
		},
		text: {
			default: text('Text in chip', 'Click me')
		},
		label: {
			default: boolean('Label', false, 'Button')
		},
		outlined: {
			default: boolean('Outlined', false, 'Button')
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
		close: {
			default: boolean('Close', false, 'Button')
		},
		disabled: {
			default: boolean('Disabled', false, 'Button')
		},
		active: {
			default: boolean('Active', true, 'Button')
		},
		color: {
			default: text('Color', '--chip-primary-text-color', 'Colors')
		},
		backgroundColor: {
			default: text('Background Color', '--chip-primary-background-color', 'Colors')
		},
		hoverColor: {
			default: text('Color (hover)', '--chip-primary-text-color', 'Colors')
		},
		hoverBackgroundColor: {
			default: text(
				'Background Color (hover)',
				'--chip-primary-background-color-hover',
				'Colors'
			)
		}
	},
	template: `
		<v-chip
			:active="active"
			:label="label"
			:outlined="outlined"
			:color="color"
			:close="close"
			:background-color="backgroundColor"
			:hover-color="hoverColor"
			:hover-background-color="hoverBackgroundColor"
			:disabled="disabled"
			:x-small="size === 'xSmall'"
			:small="size === 'small'"
			:large="size === 'large'"
			:x-large="size === 'xLarge'"
			@click="onClick"
			@close="onClose"
		>
			<v-icon
				:name="iconName"
				:x-small="iconSize === 'xSmall'"
				:small="iconSize === 'small'"
				:large="iconSize === 'large'"
				:x-large="iconSize === 'xLarge'"
				left
			/>
			{{ text }}
		</v-chip>
	`
});

export const withColor = () => ({
	template: `
		<div>
			<v-chip
				color="--white"
				background-color="--red-600"
				hover-color="--white"
				hover-background-color="--red-400"
			>
				<v-icon
					name="delete"
					color="--white"
					left
				/>
				Delete
			</v-chip>
			<v-chip
				color="--white"
				background-color="--green-600"
				hover-color="--white"
				hover-background-color="--green-400"
			>
				<v-icon
					name="add"
					color="--white"
					left
				/>
				Add Item
			</v-chip>
			<v-chip
				color="--white"
				background-color="--amber-600"
				hover-color="--white"
				hover-background-color="--amber-400"
			>
				<v-icon
					name="warning"
					color="--white"
					left
				/>
				Watch out
			</v-chip>
		</div>
	`
});

export const sizes = () => ({
	template: `
		<div>
			<v-chip x-small>Extra small</v-chip>
			<v-chip small>Small</v-chip>
			<v-chip>Default</v-chip>
			<v-chip large>Large</v-chip>
			<v-chip x-large>Extra large</v-chip>
		</div>
	`
});
