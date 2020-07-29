import readme from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, boolean } from '@storybook/addon-knobs';

export default {
	title: 'Components / Fancy Select',
	parameters: {
		notes: readme,
	},
	decorators: [withPadding, withKnobs],
};

export const basic = () =>
	defineComponent({
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const value = ref(null);
			const items = [
				{
					value: 'code',
					icon: 'code',
					text: 'Raw Value',
					description: 'This works for most non-relational fields',
				},
				{
					value: 'palette',
					icon: 'palette',
					text: 'Formatted Value',
					description: 'Templated formatting and conditional coloring to text values',
				},
				{
					value: 'label',
					icon: 'label',
					text: 'Placard',
					description: 'Shows the value within a colored badge',
				},
				{
					value: 'assignment_turned_in',
					icon: 'assignment_turned_in',
					text: 'Progress',
					description: 'Converts number values into a progress bar',
				},
			];

			return { value, items };
		},
		template: `
			<v-fancy-select v-model="value" :items="items" :disabled="disabled" />
		`,
	});
