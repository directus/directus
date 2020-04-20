import { withKnobs, boolean, text, optionsKnob } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Vue from 'vue';
import InterfaceTextarea from './textarea.vue';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

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
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
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
		},
		setup() {
			const value = ref('');
			const onInput = action('input');
			return { onInput, value };
		},
		template: `
		<div>
			<interface-textarea
				v-model="value"
				v-bind="{ placeholder, trim, font, disabled }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
