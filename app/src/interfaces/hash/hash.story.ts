import { withKnobs, boolean, text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / Hash',
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
			<div style="max-width: 300px">
				<interface-hash
					v-model="value"
					v-bind="{ placeholder, masked, disabled }"
					@input="onInput"
				/>
				<raw-value>{{ value }}</raw-value>
				<i>The value will be hashed by the API</i>
			</div>
		`,
	});

export const withExistingValue = () =>
	defineComponent({
		components: { RawValue },
		props: {
			placeholder: {
				default: text('Placeholder', 'Enter a value...', 'Options'),
			},
			masked: {
				default: boolean('Masked', false, 'Options'),
			},
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
		},
		setup() {
			const onInput = action('input');
			const value = ref('abcdef');
			return { onInput, value };
		},
		template: `
			<div style="max-width: 300px">
				<interface-hash
					v-model="value"
					v-bind="{ placeholder, masked, disabled }"
					@input="onInput"
				/>
				<raw-value>{{ value }}</raw-value>
				<i>The value will be hashed by the API</i>
			</div>
		`,
	});
