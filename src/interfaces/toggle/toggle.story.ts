import { withKnobs, text, color } from '@storybook/addon-knobs';
import readme from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / Toggle',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			iconOn: {
				default: text('Icon (On)', 'check_box'),
			},
			iconOff: {
				default: text('Icon (Off)', 'check_box_outline_blank'),
			},
			label: {
				default: text('Label', 'This is the label'),
			},
			color: {
				default: color('Color', '#2f80ed'),
			},
		},
		setup() {
			const value = ref(false);
			return { value };
		},
		template: `
		<div>
			<interface-toggle
				v-model="value"
				:icon-on="iconOn"
				:icon-off="iconOff"
				:color="color"
				:label="label"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
