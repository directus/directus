import { withKnobs, boolean, text, optionsKnob } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import InterfaceTextInput from './text-input.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

Vue.component('interface-text-input', InterfaceTextInput);

export default {
	title: 'Interfaces / Text Input',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
			},
			masked: {
				default: boolean('Masked', false, 'Options'),
			},
			iconLeft: {
				default: text('Icon Left', '', 'Options'),
			},
			iconRight: {
				default: text('Icon Right', '', 'Options'),
			},
			trim: {
				default: boolean('Trim', false, 'Options'),
			},
			font: {
				default: optionsKnob(
					'Font',
					{ Sans: 'sans-serif', Serif: 'serif', Mono: 'monospace' },
					'sans',
					{ display: 'select' },
					'Options'
				),
			},
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
		},
		setup() {
			const onInput = action('input');
			const value = ref(null);
			return { onInput, value };
		},
		template: `
		<div>
			<interface-text-input
				v-model="value"
				v-bind="{ placeholder, masked, iconLeft, iconRight, trim, font, disabled }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
