import RawValue from '../../../.storybook/raw-value.vue';
import { defineComponent, ref } from '@vue/composition-api';
import { withKnobs, number, boolean } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import withPadding from '../../../.storybook/decorators/with-padding';
import readme from './readme.md';

export default {
	title: 'Interfaces / Slider',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: readme,
	},
};

export const slider = () =>
	defineComponent({
		components: { RawValue },
		props: {
			minValue: {
				default: number('Min Value', 0, {}, 'Options'),
			},
			maxValue: {
				default: number('Max Value', 10, {}, 'Options'),
			},
			stepInterval: {
				default: number('Step Interval', 1, {}, 'Options'),
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
			<interface-slider
				v-model="value"
				v-bind="{ minValue, maxValue, stepInterval, disabled }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
