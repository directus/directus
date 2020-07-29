import { withKnobs, select } from '@storybook/addon-knobs';
import readme from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';

export default {
	title: 'Interfaces / WYSIWYG',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			font: {
				default: select('Font', ['sans-serif', 'serif', 'monospace'], 'serif'),
			},
		},
		setup() {
			const value = ref(false);
			return { value };
		},
		template: `
		<div>
			<interface-wysiwyg
				v-model="value"
				:font="font"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
