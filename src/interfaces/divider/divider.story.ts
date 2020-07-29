import { withKnobs, text } from '@storybook/addon-knobs';
import Vue from 'vue';
import InterfaceDivider from './divider.vue';

import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';

Vue.component('interface-divider', InterfaceDivider);

export default {
	title: 'Interfaces / Divider',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const input = () =>
	defineComponent({
		props: {
			color: {
				default: text('Color', '', 'Options'),
			},
			icon: {
				default: text('Icon', '', 'Options'),
			},
			title: {
				default: text('Title', '', 'Options'),
			},
		},
		template: `
		<div>
			<interface-divider
				v-bind="{ color, icon, title }"
			/>
		</div>
		`,
	});
