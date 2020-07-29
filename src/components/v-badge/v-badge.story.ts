import { withKnobs, text, boolean, number } from '@storybook/addon-knobs';
import Vue from 'vue';
import VBadge from './v-badge.vue';
import VIcon from '../v-icon/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-badge', VBadge);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Badge',
	component: VBadge,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const withButton = () => ({
	props: {
		value: {
			default: text('Text in badge', '3', 'Badge'),
		},
		dot: {
			default: boolean('Dot', false, 'Badge'),
		},
		left: {
			default: boolean('Left', false, 'Badge'),
		},
		bottom: {
			default: boolean('Bottom', false, 'Badge'),
		},
		offsetX: {
			default: number('Offset X', 0, undefined, 'Badge'),
		},
		offsetY: {
			default: number('Offset Y', 0, undefined, 'Badge'),
		},
		icon: {
			default: text('Icon', '', 'Badge'),
		},
		bordered: {
			default: boolean('Bordered', false, 'Badge'),
		},
	},
	template: `
		<v-badge
			:value="value"
			:dot="dot"
			:left="left"
			:bottom="bottom"
			:icon="icon"
			:bordered="bordered"
			:style="{
				'--v-badge-offset-x': (offsetX + 'px'),
				'--v-badge-offset-y': (offsetY + 'px')
			}"
		>
			<v-button>Click me!</v-button>
		</v-badge>
	`,
});

export const withText = () => ({
	props: {
		value: {
			default: text('Text in badge', '3', 'Badge'),
		},
		dot: {
			default: boolean('Dot', false, 'Badge'),
		},
		left: {
			default: boolean('Left', false, 'Badge'),
		},
		bottom: {
			default: boolean('Bottom', false, 'Badge'),
		},
		offsetX: {
			default: number('Offset X', 0, undefined, 'Badge'),
		},
		offsetY: {
			default: number('Offset Y', 0, undefined, 'Badge'),
		},
		icon: {
			default: text('Icon', '', 'Badge'),
		},
		bordered: {
			default: boolean('Bordered', false, 'Badge'),
		},
	},
	template: `
		<v-badge
			:value="value"
			:dot="dot"
			:left="left"
			:bottom="bottom"
			:icon="icon"
			:bordered="bordered"
			:style="{
				'--v-badge-offset-x': (offsetX + 'px'),
				'--v-badge-offset-y': (offsetY + 'px')
			}"
		>
			Example text.
		</v-badge>
	`,
});

export const withAvatar = () => ({
	props: {
		value: {
			default: text('Text in badge', '3', 'Badge'),
		},
		dot: {
			default: boolean('Dot', false, 'Badge'),
		},
		left: {
			default: boolean('Left', false, 'Badge'),
		},
		bottom: {
			default: boolean('Bottom', false, 'Badge'),
		},
		icon: {
			default: text('Icon', '', 'Badge'),
		},
	},
	template: `
		<v-badge
			:value="value"
			:dot="dot"
			:left="left"
			:bottom="bottom"
			:icon="icon"
			:bordered="true"
			:style="{
				'--v-badge-offset-x': '3px',
				'--v-badge-offset-y': '3px'
			}"
		>
			<v-avatar>RVZ</v-avatar>
		</v-badge>
	`,
});

export const colors = () => ({
	template: `
		<div>
			<v-badge
				style="--v-badge-color: var(--white);--v-badge-background-color: var(--red-500); margin-right: 20px"
				value="9+"
			>
				<v-button>Click me!</v-button>
			</v-badge>
			<v-badge
				style="--v-badge-color: var(--white);--v-badge-background-color: var(--green-500); margin-right: 20px"
				icon="spa"
			>
				<v-button>Click me!</v-button>
			</v-badge>
			<v-badge
				style="--v-badge-color: var(--white);--v-badge-background-color: var(--orange-500)"
				icon="notifications_active"
			>
				<v-button>Click me!</v-button>
			</v-badge>
		</div>
	`,
});
