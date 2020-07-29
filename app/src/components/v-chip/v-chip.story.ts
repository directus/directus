import { withKnobs, text, boolean, color, optionsKnob as options } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import VChip from './v-chip.vue';
import VIcon from '../v-icon/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-chip', VChip);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Chip',
	component: VChip,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const withText = () => ({
	methods: { onClick: action('click'), onClose: action('close') },
	props: {
		text: {
			default: text('Text in chip', 'Click me'),
		},
		label: {
			default: boolean('Label', false, 'Button'),
		},
		outlined: {
			default: boolean('Outlined', false, 'Button'),
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
				},
				'Button'
			),
		},
		close: {
			default: boolean('Close', false, 'Button'),
		},
		disabled: {
			default: boolean('Disabled', false, 'Button'),
		},
		active: {
			default: boolean('Active', true, 'Button'),
		},
		color: {
			default: color('Color', '#000000', 'Colors'),
		},
		backgroundColor: {
			default: color('Background Color', '#cfd8dc', 'Colors'),
		},
		hoverColor: {
			default: color('Color (hover)', '#000000', 'Colors'),
		},
		hoverBackgroundColor: {
			default: color('Background Color (hover)', '#b0bec5', 'Colors'),
		},
	},
	template: `
		<v-chip
			:active.sync="active"
			:label="label"
			:outlined="outlined"
			:close="close"
			:style="{
				'--v-chip-color': color,
				'--v-chip-background-color': backgroundColor,
				'--v-chip-color-hover': hoverColor,
				'--v-chip-background-color-hover': hoverBackgroundColor
			}"
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
	`,
});

export const withIcon = () => ({
	methods: { onClick: action('click'), onClose: action('close') },
	props: {
		iconName: {
			default: text('Material Icon', 'add'),
		},
		text: {
			default: text('Text in chip', 'Click me'),
		},
		label: {
			default: boolean('Label', false, 'Button'),
		},
		outlined: {
			default: boolean('Outlined', false, 'Button'),
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
				},
				'Button'
			),
		},
		iconSize: {
			default: options(
				'Size (Icon)',
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
				},
				'Button'
			),
		},
		close: {
			default: boolean('Close', false, 'Button'),
		},
		disabled: {
			default: boolean('Disabled', false, 'Button'),
		},
		active: {
			default: boolean('Active', true, 'Button'),
		},
		color: {
			default: color('Color', '#000000', 'Colors'),
		},
		backgroundColor: {
			default: color('Background Color', '#cfd8dc', 'Colors'),
		},
		hoverColor: {
			default: color('Color (hover)', '#000000', 'Colors'),
		},
		hoverBackgroundColor: {
			default: color('Background Color (hover)', '#b0bec5', 'Colors'),
		},
	},
	template: `
		<v-chip
			:active="active"
			:label="label"
			:outlined="outlined"
			:close="close"
			:style="{
				'--v-chip-color': color,
				'--v-chip-background-color': backgroundColor,
				'--v-chip-color-hover': hoverColor,
				'--v-chip-background-color-hover': hoverBackgroundColor
			}"
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
	`,
});

export const withColor = () => ({
	template: `
		<div>
			<v-chip
				style="
					--v-chip-color: var(--white);
					--v-chip-background-color: var(--red-600);
					--v-chip-color-hover: var(--white);
					--v-chip-background-color-hover: var(--red-400);
				"
			>
				<v-icon
					name="delete"
					style="--v-icon-color: var(--white)"
					left
				/>
				Delete
			</v-chip>
			<v-chip
				style="
					--v-chip-color: var(--white);
					--v-chip-background-color: var(--green-600);
					--v-chip-color-hover: var(--white);
					--v-chip-background-color-hover: var(--green-400);
				"
			>
				<v-icon
					name="add"
					style="--v-icon-color: var(--white)"
					left
				/>
				Add Item
			</v-chip>
			<v-chip
				style="
					--v-chip-color: var(--white);
					--v-chip-background-color: var(--amber-600);
					--v-chip-color-hover: var(--white);
					--v-chip-background-color-hover: var(--amber-400);
				"
			>
				<v-icon
					name="warning"
					style="--v-icon-color: var(--white)"
					left
				/>
				Watch out
			</v-chip>
		</div>
	`,
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
	`,
});
