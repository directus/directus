import { withKnobs, text, boolean } from '@storybook/addon-knobs';
import Vue from 'vue';
import VNotice from './v-notice.vue';
import VIcon from '../v-icon/';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-notice', VNotice);
Vue.component('v-icon', VIcon);

export default {
	title: 'Components / Notice',
	component: VNotice,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const withText = () => ({
	props: {
		text: {
			default: text('Text', 'This is a notice')
		},
		success: {
			default: boolean('Success', false)
		},
		warning: {
			default: boolean('Warning', false)
		},
		danger: {
			default: boolean('Danger', false)
		}
	},
	template: `<v-notice :success="success" :warning="warning" :danger="danger">{{text}}</v-notice>`
});

export const withCustomColors = () => ({
	props: {
		color: {
			default: text('Color', 'red')
		},
		backgroundColor: {
			default: text('Background Color', 'papayawhip')
		},
		iconColor: {
			default: text('Icon Color', 'blue')
		}
	},
	template: `
	<v-notice
		:style="{
			'--v-notice-color': color,
			'--v-notice-background-color': backgroundColor,
			'--v-notice-icon-color': iconColor
		}"
	>This is a notice</v-notice>
	`
});

export const withCustomIcon = () => ({
	props: {
		icon: {
			default: text('Icon', 'translate')
		}
	},
	template: `
	<v-notice :icon="icon">This is a notice</v-notice>
	`
});

export const noIcon = () => ({
	template: `
	<v-notice :icon="false">This is a notice</v-notice>
	`
});
