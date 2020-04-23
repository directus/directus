import withPadding from '../../../.storybook/decorators/with-padding';
import readme from './readme.md';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';
import { withKnobs, boolean } from '@storybook/addon-knobs';

export default {
	title: 'Components / Radio',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<v-radio :disabled="disabled" value="red" v-model="value" label="Red" />
				<v-radio :disabled="disabled" value="blue" v-model="value" label="Blue" />
				<v-radio :disabled="disabled" value="green" v-model="value" label="Green" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});

export const blockStyle = () =>
	defineComponent({
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false),
			},
		},
		setup() {
			const value = ref(null);
			return { value };
		},
		template: `
			<div style="max-width: 300px;">
				<v-radio block style="margin-bottom: 12px;" :disabled="disabled" value="red" v-model="value" label="Red" />
				<v-radio block style="margin-bottom: 12px;" :disabled="disabled" value="blue" v-model="value" label="Blue" />
				<v-radio block :disabled="disabled" value="green" v-model="value" label="Green" />
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
