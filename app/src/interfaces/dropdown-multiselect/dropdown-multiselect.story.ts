import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { boolean, withKnobs, text } from '@storybook/addon-knobs';
import readme from './readme.md';
import i18n from '@/lang';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / Dropdown (Multiselect)',
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
			allowNone: {
				default: boolean('Allow None', false),
			},
			placeholder: {
				default: text('Placeholder', 'Select something'),
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
			icon: {
				default: text('Icon', 'person'),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<interface-dropdown-multiselect
					v-model="value"
					:allow-other="allowOther"
					:allow-none="allowNone"
					:placeholder="placeholder"
					:choices="choices"
					:icon="icon"
				/>
				<portal-target multiple name="outlet" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
