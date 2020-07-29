import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { boolean, withKnobs, text, select, color } from '@storybook/addon-knobs';
import readme from './readme.md';
import i18n from '@/lang';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / Radio Buttons',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		i18n,
		props: {
			allowOther: {
				default: boolean('Allow Other', false),
			},
			choices: {
				default: text(
					'Choices',
					`
Option A
Option B
custom_value::Option C
trim :: Option D
`
				),
			},
			fieldWidth: {
				default: select('Field Width', ['half', 'full'], 'full'),
			},
			color: {
				default: color('Color', '#2f80ed'),
			},
			iconOn: {
				default: text('Icon (On)', 'radio_button_checked'),
			},
			iconOff: {
				default: text('Icon (Off)', 'radio_button_unchecked'),
			},
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div :style="{
				maxWidth: fieldWidth === 'half' ? '300px' : '632px'
			}">
				<interface-radio-buttons
					v-model="value"
					:allow-other="allowOther"
					:choices="choices"
					:width="fieldWidth"
					:color="color"
					:icon-on="iconOn"
					:icon-off="iconOff"
					:disabled="disabled"
				/>
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
