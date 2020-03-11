import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import InterfaceTextInput from './text-input.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent } from '@vue/composition-api';

Vue.component('interface-text-input', InterfaceTextInput);

export default {
	title: 'Interfaces / Text Input',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown
	}
};

export const basic = () =>
	defineComponent({
		props: {
			monospace: {
				default: boolean('Monospace', false, 'Options')
			},
			trim: {
				default: boolean('Trim', false, 'Options')
			},
			showCharacterCount: {
				default: boolean('Show Character Count', false, 'Options')
			},
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options')
			}
		},
		setup() {
			const onInput = action('input');
			return { onInput };
		},
		template: `
			<interface-text-input
				:options="{ monospace, trim, showCharacterCount, placeholder }"
				@input="onInput"
			/>
		`
	});
