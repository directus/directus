import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import InterfaceTextarea from './textarea.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';

Vue.component('interface-textarea', InterfaceTextarea);

export default {
	title: 'Interfaces / Textarea',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			monospace: {
				default: boolean('Monospace', false, 'Options'),
			},
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
			},
		},
		setup() {
			const onInput = action('input');
			return { onInput };
		},
		template: `
			<interface-textarea
				v-bind="{ monospace, placeholder, rows }"
				@input="onInput"
			/>
		`,
	});
